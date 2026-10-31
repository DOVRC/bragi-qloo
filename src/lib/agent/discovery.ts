import { CatalogueService } from "@/lib/catalogue/service";
import { QlooService } from "@/lib/qloo/client";
import { mergeRankingPaths, rankQlooIndexedCandidates } from "@/lib/qloo/nativeRanking";
import { resolveSignalEntity } from "@/lib/resolve";
import { parseDiscoverInput } from "@/lib/signals";
import { buildDiscoveryTrace, sanitizeEntity } from "@/lib/agent/trace";
import {
  QlooClientError,
  type AgentStep,
  type CatalogueKind,
  type DiscoverRequest,
  type DiscoverResponse,
  type DiscoveryIntent,
  type QlooEntity,
  type QlooEntityType,
  type TasteEvidence,
  type TasteProfile,
} from "@/lib/types";

/** Stay under Vercel function maxDuration (60s) with headroom for response serialization. */
export const DISCOVERY_DEADLINE_MS = 50_000;
const SEARCH_TIMEOUT_MS = 12_000;
const TAGS_TIMEOUT_MS = 10_000;
const INSIGHTS_CALL_TIMEOUT_MS = 16_000;
const NATIVE_RANK_TIMEOUT_MS = 18_000;

export interface DiscoveryAgentOptions {
  qloo?: QlooService;
  catalogue?: CatalogueService;
  /** When true, skip live Qloo and use deterministic fixture-like affinities for UI only */
  sampleDataMode?: boolean;
}

interface InsightPlan {
  filterType: QlooEntityType;
  locationQuery?: string;
  reason: string;
}

export class DiscoveryAgent {
  private readonly qloo: QlooService;
  private readonly catalogue: CatalogueService;
  private readonly sampleDataMode: boolean;

  constructor(options: DiscoveryAgentOptions = {}) {
    this.qloo = options.qloo ?? new QlooService();
    this.catalogue = options.catalogue ?? new CatalogueService();
    this.sampleDataMode =
      options.sampleDataMode ?? process.env.SAMPLE_DATA_MODE === "true";
  }

  async run(input: DiscoverRequest): Promise<DiscoverResponse> {
    const steps: AgentStep[] = [
      { id: "interpret", label: "Interpret interests and constraints", status: "pending" },
      { id: "resolve", label: "Resolve cultural entities via Qloo Search", status: "pending" },
      { id: "tags", label: "Resolve genre/theme tags via Qloo Tags", status: "pending" },
      { id: "insights", label: "Query Qloo Insights for affinities", status: "pending" },
      { id: "profile", label: "Build taste preference profile", status: "pending" },
      { id: "catalogue", label: "Evaluate Medellín catalogue matches", status: "pending" },
      { id: "rank", label: "Rank and explain recommendations", status: "pending" },
    ];

    const warnings: string[] = [];
    const mode = this.sampleDataMode ? "sample" : "live";
    const startedAt = Date.now();
    const intent: DiscoveryIntent = input.intent ?? "mixed";
    const remaining = () => DISCOVERY_DEADLINE_MS - (Date.now() - startedAt);

    try {
      setStep(steps, "interpret", "running");
      const parsed = parseDiscoverInput(input);
      if (parsed.signals.length === 0) {
        setStep(steps, "interpret", "error", "No cultural signals detected");
        return {
          ok: false,
          mode,
          error: {
            code: "NO_SIGNALS",
            message:
              "Could not detect cultural signals. Try naming artists, films, or genres (e.g. Radiohead, Studio Ghibli).",
          },
          steps,
        };
      }
      setStep(
        steps,
        "interpret",
        "done",
        `${parsed.signals.length} signal(s) [${parsed.signals.map((s) => s.kind).join(", ")}]; city=${parsed.city}; budget=${parsed.budgetCop ?? "n/a"}; intent=${intent}`,
      );

      let resolvedEntities: QlooEntity[] = [];
      let affinityEntities: QlooEntity[] = [];
      let affinityTags: string[] = [];
      const signalTagIds: string[] = [];
      const evidence: TasteEvidence[] = [];

      if (this.sampleDataMode) {
        setStep(steps, "resolve", "skipped", "SAMPLE_DATA_MODE — not a live Qloo response");
        setStep(steps, "tags", "skipped", "SAMPLE_DATA_MODE");
        setStep(steps, "insights", "skipped", "SAMPLE_DATA_MODE — affinities are illustrative only");
        warnings.push(
          "Sample-data mode is ON. Results are for UI development and must not be presented as live Qloo output.",
        );
        resolvedEntities = parsed.signals.map((s, i) => ({
          id: `sample-entity-${i}`,
          name: s.raw,
          type: s.inferredType,
        }));
        affinityEntities = [
          { id: "sample-aff-1", name: "Experimental electronic", type: "urn:entity:artist" },
          { id: "sample-aff-2", name: "Art-house animation", type: "urn:entity:movie" },
          { id: "sample-aff-3", name: "Contemporary jazz", type: "urn:entity:artist" },
        ];
        affinityTags = ["experimental", "cinematic", "jazz", "indie"];
        evidence.push({
          source: "user_signal",
          detail: "Sample mode: signals echoed without live Qloo verification.",
        });
      } else {
        if (!this.qloo.hasCredentials()) {
          setStep(steps, "resolve", "error", "Missing QLOO_API_KEY");
          return {
            ok: false,
            mode: "live",
            error: {
              code: "MISSING_API_KEY",
              message:
                "Qloo credentials are not configured on the server. Add QLOO_API_KEY to .env.local (never commit it).",
            },
            steps,
          };
        }

        setStep(steps, "resolve", "running");
        const resolveSignals = parsed.signals.slice(0, 5);
        // Bounded parallelism (chunks of 2) + per-call timeout under the discovery deadline.
        for (let i = 0; i < resolveSignals.length; i += 2) {
          if (remaining() < SEARCH_TIMEOUT_MS + 2_000) {
            warnings.push(
              "Discovery time budget low — skipped remaining Search resolves (partial results).",
            );
            break;
          }
          const chunk = resolveSignals.slice(i, i + 2);
          const settled = await Promise.allSettled(
            chunk.map((signal) =>
              resolveSignalEntity(this.qloo, signal, { timeoutMs: SEARCH_TIMEOUT_MS }),
            ),
          );
          for (const item of settled) {
            if (item.status === "fulfilled") {
              const resolved = item.value;
              if (resolved.entity) {
                resolvedEntities.push(resolved.entity);
                evidence.push({
                  source: "qloo_search",
                  entityId: resolved.entity.id,
                  entityName: resolved.entity.name,
                  detail: `Mapped “${resolved.signal.raw}” → “${resolved.entity.name}” (${resolved.strategy}).`,
                });
              } else {
                warnings.push(resolved.warning ?? `Unresolved signal “${resolved.signal.raw}”.`);
              }
            } else {
              const err = item.reason;
              if (err instanceof QlooClientError) {
                if (err.code === "TIMEOUT" || err.code === "FORBIDDEN") {
                  warnings.push(`Search ${err.code.toLowerCase()}; continuing with partial resolves.`);
                  continue;
                }
                setStep(steps, "resolve", "error", err.message);
                return {
                  ok: false,
                  mode: "live",
                  error: { code: err.code, message: err.message },
                  steps,
                };
              }
              throw err;
            }
          }
        }
        resolvedEntities = dedupeEntities(resolvedEntities);
        setStep(
          steps,
          "resolve",
          "done",
          `Resolved ${resolvedEntities.length}/${parsed.signals.length}: ${resolvedEntities.map((e) => e.name).join(", ") || "none"}`,
        );

        // Genre/theme tag lookup — only when genre signals present
        const genreSignals = parsed.signals.filter((s) => s.kind === "genre_or_theme");
        if (genreSignals.length === 0) {
          setStep(steps, "tags", "skipped", "No genre/theme signals to resolve");
        } else {
          setStep(steps, "tags", "running");
          for (const signal of genreSignals.slice(0, 3)) {
            if (remaining() < TAGS_TIMEOUT_MS + 2_000) {
              warnings.push("Discovery time budget low — skipped remaining Tags lookups.");
              break;
            }
            try {
              const tags = await this.qloo.searchTags(signal.raw, 5, {
                timeoutMs: TAGS_TIMEOUT_MS,
              });
              for (const tag of tags.slice(0, 3)) {
                signalTagIds.push(tag.id);
                affinityTags.push(tag.name.toLowerCase());
                evidence.push({
                  source: "qloo_search",
                  entityId: tag.id,
                  entityName: tag.name,
                  detail: `Tag for “${signal.raw}”: ${tag.name}.`,
                });
              }
            } catch (err) {
              if (err instanceof QlooClientError && err.code === "FORBIDDEN") {
                warnings.push(`Tags search forbidden for “${signal.raw}”; continuing.`);
                continue;
              }
              if (err instanceof QlooClientError && err.code === "TIMEOUT") {
                warnings.push(`Tags search timed out for “${signal.raw}”; continuing.`);
                continue;
              }
              if (err instanceof QlooClientError) {
                warnings.push(`Tags search failed: ${err.message}`);
                break;
              }
              throw err;
            }
          }
          setStep(
            steps,
            "tags",
            "done",
            signalTagIds.length
              ? `Resolved ${signalTagIds.length} tag id(s)`
              : "No tags resolved",
          );
        }

        setStep(steps, "insights", "running");
        if (resolvedEntities.length === 0 && signalTagIds.length === 0) {
          setStep(steps, "insights", "skipped", "No entity/tag IDs available for Insights");
          warnings.push("Insights skipped because no Qloo entities or tags were resolved.");
        } else {
          // Skip broad place Insights — indexed venues are ranked via Path A
          // (filter.results.entities) to avoid a duplicate slow place call.
          const plan = planInsights(parsed.signals, resolvedEntities, parsed.city).filter(
            (p) => p.filterType !== "urn:entity:place",
          );
          const executed: string[] = [];
          const chunks: typeof plan[] = [];
          for (let i = 0; i < plan.length; i += 2) chunks.push(plan.slice(i, i + 2));

          let fatalInsights: QlooClientError | null = null;
          for (const chunk of chunks) {
            if (remaining() < INSIGHTS_CALL_TIMEOUT_MS + NATIVE_RANK_TIMEOUT_MS + 3_000) {
              warnings.push(
                "Discovery time budget low — skipped remaining exploratory Insights (partial affinities).",
              );
              break;
            }
            const settled = await Promise.allSettled(
              chunk.map((attempt) =>
                this.qloo.getInsights({
                  filterType: attempt.filterType,
                  signalEntityIds: resolvedEntities.map((e) => e.id),
                  signalTags: signalTagIds.length ? signalTagIds.slice(0, 5) : undefined,
                  locationQuery: attempt.locationQuery,
                  take: 5,
                  timeoutMs: Math.min(INSIGHTS_CALL_TIMEOUT_MS, Math.max(4_000, remaining() - NATIVE_RANK_TIMEOUT_MS - 2_000)),
                }).then((result) => ({ attempt, result })),
              ),
            );

            for (const item of settled) {
              if (item.status === "fulfilled") {
                const { attempt, result } = item.value;
                executed.push(
                  `${attempt.filterType.split(":").pop()}${attempt.locationQuery ? `@${attempt.locationQuery}` : ""}:${result.entities.length}`,
                );
                affinityEntities.push(...result.entities);
                affinityTags.push(...result.tags);
                for (const e of result.entities.slice(0, 4)) {
                  evidence.push({
                    source: "qloo_insights",
                    entityId: e.id,
                    entityName: e.name,
                    detail: `Insights (${attempt.filterType}) — ${attempt.reason}: “${e.name}”.`,
                  });
                }
              } else {
                const err = item.reason;
                if (err instanceof QlooClientError) {
                  if (err.code === "FORBIDDEN" || err.code === "TIMEOUT") {
                    warnings.push(
                      `Insights call ${err.code.toLowerCase()}; continuing with partial evidence.`,
                    );
                    continue;
                  }
                  fatalInsights = err;
                  break;
                }
                throw err;
              }
            }
            if (fatalInsights) break;
          }

          if (fatalInsights) {
            setStep(steps, "insights", "error", fatalInsights.message);
            return {
              ok: false,
              mode: "live",
              error: { code: fatalInsights.code, message: fatalInsights.message },
              steps,
            };
          }

          affinityEntities = dedupeEntities(affinityEntities);
          affinityTags = prioritizeTags(affinityTags).slice(0, 48);
          if (executed.length === 0) {
            setStep(
              steps,
              "insights",
              "skipped",
              "Insights unavailable/timed out; matching with resolved entities/tags only",
            );
            warnings.push(
              "Qloo Insights did not return in time. Recommendations use resolved Search entities and tags only — not fabricated Insights.",
            );
            if (resolvedEntities.length === 0 && signalTagIds.length === 0) {
              return {
                ok: false,
                mode: "live",
                error: {
                  code: "TIMEOUT",
                  message:
                    "Qloo Insights timed out and no entities/tags were available for matching.",
                },
                steps,
              };
            }
          } else {
            setStep(
              steps,
              "insights",
              "done",
              `${affinityEntities.length} affinities; plan=[${executed.join(" | ")}]`,
            );
          }
        }
      }

      setStep(steps, "profile", "running");
      const profile: TasteProfile = {
        city: parsed.city,
        budgetCop: parsed.budgetCop,
        signals: parsed.signals,
        resolvedEntities: resolvedEntities.map(sanitizeEntity),
        affinityEntities: affinityEntities.map(sanitizeEntity),
        affinityTags,
        evidence,
      };
      setStep(
        steps,
        "profile",
        "done",
        `${profile.resolvedEntities.length} entities · ${profile.affinityEntities.length} affinities · ${profile.affinityTags.length} tags`,
      );

      setStep(steps, "catalogue", "running");

      const kindFilter = kindsForIntent(intent);

      // Path A — Qloo-native candidate ranking for catalogue rows with verified entity IDs
      let nativeRecs: Awaited<ReturnType<typeof rankQlooIndexedCandidates>>["recommendations"] =
        [];
      const skipNative =
        intent === "creators" ||
        remaining() < NATIVE_RANK_TIMEOUT_MS + 2_000 ||
        this.sampleDataMode ||
        !this.qloo.hasCredentials() ||
        profile.resolvedEntities.length === 0;

      if (!skipNative) {
        try {
          const native = await rankQlooIndexedCandidates({
            qloo: this.qloo,
            profile,
            entries: this.catalogue.list({
              city: profile.city,
              budgetCop: profile.budgetCop,
              includeDemonstration: false,
              kinds: kindFilter,
            }),
            limit: 3,
          });
          nativeRecs = native.recommendations.map((r) => ({
            ...r,
            qlooAggregateExplainability: native.aggregateExplainability,
          }));
          warnings.push(...native.warnings);
          if (native.elapsedMs != null) {
            warnings.push(`Qloo-native Insights elapsed ${native.elapsedMs}ms.`);
          }
          if (native.returnedCandidateCount > 0) {
            warnings.push(
              `Qloo-native path ranked ${native.returnedCandidateCount}/${native.indexedCandidateCount} indexed candidates (sorted by query.affinity when present).`,
            );
          }
          if (native.aggregateExplainability?.available) {
            warnings.push(
              "Aggregate Insights explainability is available for the native result set (not per-card).",
            );
          }
        } catch (err) {
          warnings.push(
            `Qloo-native candidate ranking failed; continuing with Bragi catalogue matching. (${
              err instanceof Error ? err.message : "unknown"
            })`,
          );
        }
      } else if (intent === "creators") {
        warnings.push(
          "Creators intent — skipped Qloo-native place ranking so independent creators can surface via catalogue evidence.",
        );
      } else if (!this.sampleDataMode && remaining() < NATIVE_RANK_TIMEOUT_MS + 2_000) {
        warnings.push(
          "Discovery time budget low — skipped Qloo-native ranking; using catalogue matches only.",
        );
      }

      // Path B — Bragi evidence-aware matching (includes creators without Qloo IDs).
      // Live mode never injects demonstration profiles into recommendations.
      const catalogueRecs = this.catalogue.match(profile, 6, {
        includeDemonstration: this.sampleDataMode,
        kinds: kindFilter,
      });
      if (catalogueRecs.length === 0 && !this.sampleDataMode) {
        warnings.push(
          "No verified catalogue entries met the evidence threshold for this intent — honest empty Path B (demonstration profiles were not injected).",
        );
      }

      const recommendations = mergeRankingPaths(nativeRecs, catalogueRecs, {
        limit: 3,
        intent,
      });
      warnings.push(`Discovery wall time ${Date.now() - startedAt}ms (deadline ${DISCOVERY_DEADLINE_MS}ms).`);
      setStep(
        steps,
        "catalogue",
        "done",
        recommendations.length
          ? `${recommendations.length} match(es) · native=${nativeRecs.length} · catalogue=${catalogueRecs.length}`
          : "No catalogue entry met the evidence threshold",
      );

      setStep(steps, "rank", "running");
      if (recommendations.length === 0) {
        setStep(steps, "rank", "done", "Honest empty state — no fabricated recommendations");
        warnings.push(
          "No defensible local matches for the current Qloo evidence and constraints. Try different signals, raise budget, or broaden tastes.",
        );
      } else {
        const nativeBacked = recommendations.filter((r) => r.rankingPath === "qloo_native").length;
        const insightBacked = recommendations.filter((r) => r.qlooInsightsPoints > 0).length;
        setStep(
          steps,
          "rank",
          "done",
          `Top: ${recommendations.map((r) => r.entry.name).join(" · ")} · native=${nativeBacked} · Insights-overlap=${insightBacked}`,
        );
      }

      const trace = buildDiscoveryTrace({
        mode,
        profile,
        recommendations,
        steps,
        warnings,
      });

      return {
        ok: true,
        mode,
        profile,
        recommendations,
        steps,
        warnings,
        trace,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected discovery failure";
      return {
        ok: false,
        mode,
        error: { code: "UNKNOWN", message },
        steps,
      };
    }
  }
}

/** Choose Insights domains from resolved Qloo types + signal evidence — not a fixed artist default. */
export function planInsights(
  signals: ReturnType<typeof parseDiscoverInput>["signals"],
  resolved: QlooEntity[],
  city: string,
): InsightPlan[] {
  const plan: InsightPlan[] = [];
  const seen = new Set<string>();
  const push = (item: InsightPlan) => {
    if (seen.has(item.filterType)) return;
    seen.add(item.filterType);
    plan.push(item);
  };

  const text = signals.map((s) => s.raw.toLowerCase()).join(" ");
  const inferred = signals.map((s) => s.inferredType).filter(Boolean) as QlooEntityType[];

  // Adaptive: mirror real resolved entity types first.
  for (const entity of resolved) {
    const t = (entity.type ?? "").toLowerCase();
    if (!t || t.includes("place") || t.includes("locality") || t.includes("destination")) continue;
    if (t.includes("artist") || t.includes("person")) {
      push({
        filterType: "urn:entity:artist",
        reason: `resolved type ${entity.type} (${entity.name})`,
      });
    } else if (t.includes("movie") || t.includes("tv_show") || t.includes("film")) {
      push({
        filterType: "urn:entity:movie",
        reason: `resolved type ${entity.type} (${entity.name})`,
      });
    } else if (t.includes("brand")) {
      push({
        filterType: "urn:entity:brand",
        reason: `resolved type ${entity.type} (${entity.name})`,
      });
    } else if (t.includes("book")) {
      push({
        filterType: "urn:entity:book",
        reason: `resolved type ${entity.type} (${entity.name})`,
      });
    }
  }

  for (const t of inferred) {
    const lower = t.toLowerCase();
    if (lower.includes("artist")) {
      push({ filterType: "urn:entity:artist", reason: "signal inferred artist type" });
    } else if (lower.includes("movie") || lower.includes("tv_show")) {
      push({ filterType: "urn:entity:movie", reason: "signal inferred film/TV type" });
    } else if (lower.includes("brand")) {
      push({ filterType: "urn:entity:brand", reason: "signal inferred brand type" });
    }
  }

  // Genre / theme cues without forcing artist for every resolved entity.
  if (/\b(jazz|reggaeton|salsa|hip hop|hip-hop|electronic|cumbia|rock|music|dance)\b/i.test(text)) {
    push({
      filterType: "urn:entity:artist",
      reason: "music/genre theme in signals",
    });
  }
  if (/\b(ghibli|movie|film|anime|totoro|spirited|cinema)\b/i.test(text)) {
    push({
      filterType: "urn:entity:movie",
      reason: "film/animation theme in signals",
    });
  }
  if (/\b(fashion|nike|brand|streetwear|urban fashion)\b/i.test(text)) {
    push({
      filterType: "urn:entity:brand",
      reason: "fashion/brand theme in signals",
    });
  }

  // Places only with solid entity signals — Path A ranks indexed venues separately.
  if (resolved.length > 0 && city.toLowerCase().includes("medell")) {
    push({
      filterType: "urn:entity:place",
      locationQuery: city,
      reason: "location-filtered place affinities (matched carefully against catalogue)",
    });
  }

  // Fallback when we have entities but no domain cue — probe from the first usable resolved type.
  if (plan.length === 0 && resolved.length > 0) {
    const first = resolved.find((e) => e.type && !/place|locality/i.test(e.type));
    if (first?.type && /movie|tv_show/i.test(first.type)) {
      push({
        filterType: "urn:entity:movie",
        reason: "fallback probe from resolved film entity",
      });
    } else if (first?.type && /brand/i.test(first.type)) {
      push({
        filterType: "urn:entity:brand",
        reason: "fallback probe from resolved brand entity",
      });
    } else if (first?.type && /artist|person/i.test(first.type)) {
      push({
        filterType: "urn:entity:artist",
        reason: "fallback probe from resolved artist entity",
      });
    } else {
      // Last resort: untyped cultural expansion via artist domain is still better than inventing affinities.
      push({
        filterType: "urn:entity:artist",
        reason: "bounded fallback affinity probe (no clearer domain available)",
      });
    }
  }

  return plan.slice(0, 3);
}

export function kindsForIntent(intent: DiscoveryIntent): CatalogueKind[] | undefined {
  if (intent === "creators") return ["creator", "project"];
  if (intent === "places") return ["venue"];
  return undefined;
}

function setStep(
  steps: AgentStep[],
  id: string,
  status: AgentStep["status"],
  detail?: string,
) {
  const step = steps.find((s) => s.id === id);
  if (!step) return;
  step.status = status;
  if (detail) step.detail = detail;
}

function dedupeEntities(entities: QlooEntity[]): QlooEntity[] {
  const seen = new Set<string>();
  const out: QlooEntity[] = [];
  for (const e of entities) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

/** Prefer cultural/genre tags; down-rank place amenity noise from Insights payloads. */
export function prioritizeTags(tags: string[]): string[] {
  const scored = [...new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean))].map(
    (t) => {
      let s = 0;
      if (/genre|music|style|fashion|dance|latin|jazz|rock|urban|film|cinema|indie/.test(t)) {
        s += 6;
      }
      if (!t.startsWith("urn:")) s += 2;
      if (/amenity|setting|signage|wheelchair|parking|wifi|hours/.test(t)) s -= 8;
      if (t.length > 48) s -= 3;
      if (t.length < 3) s -= 5;
      return { t, s };
    },
  );
  return scored.sort((a, b) => b.s - a.s || a.t.localeCompare(b.t)).map((x) => x.t);
}
