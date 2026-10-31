import { CatalogueService } from "@/lib/catalogue/service";
import { QlooService } from "@/lib/qloo/client";
import { mergeRankingPaths, rankQlooIndexedCandidates } from "@/lib/qloo/nativeRanking";
import { resolveSignalEntity } from "@/lib/resolve";
import { parseDiscoverInput } from "@/lib/signals";
import { buildDiscoveryTrace, sanitizeEntity } from "@/lib/agent/trace";
import {
  QlooClientError,
  type AgentStep,
  type DiscoverRequest,
  type DiscoverResponse,
  type QlooEntity,
  type QlooEntityType,
  type TasteEvidence,
  type TasteProfile,
} from "@/lib/types";

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
        `${parsed.signals.length} signal(s) [${parsed.signals.map((s) => s.kind).join(", ")}]; city=${parsed.city}; budget=${parsed.budgetCop ?? "n/a"}`,
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
        for (const signal of parsed.signals.slice(0, 5)) {
          try {
            const resolved = await resolveSignalEntity(this.qloo, signal);
            if (resolved.entity) {
              resolvedEntities.push(resolved.entity);
              evidence.push({
                source: "qloo_search",
                entityId: resolved.entity.id,
                entityName: resolved.entity.name,
                detail: `Mapped “${signal.raw}” → “${resolved.entity.name}” (${resolved.strategy}).`,
              });
            } else {
              warnings.push(resolved.warning ?? `Unresolved signal “${signal.raw}”.`);
            }
          } catch (err) {
            if (err instanceof QlooClientError) {
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
            try {
              const tags = await this.qloo.searchTags(signal.raw, 5);
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
          // Bound concurrency (max 2) and per-call timeout so the 60s route budget holds.
          const INSIGHTS_CALL_TIMEOUT_MS = 18_000;
          const chunks: typeof plan[] = [];
          for (let i = 0; i < plan.length; i += 2) chunks.push(plan.slice(i, i + 2));

          let fatalInsights: QlooClientError | null = null;
          for (const chunk of chunks) {
            const settled = await Promise.allSettled(
              chunk.map((attempt) =>
                this.qloo.getInsights({
                  filterType: attempt.filterType,
                  signalEntityIds: resolvedEntities.map((e) => e.id),
                  signalTags: signalTagIds.length ? signalTagIds.slice(0, 5) : undefined,
                  locationQuery: attempt.locationQuery,
                  take: 5,
                  timeoutMs: INSIGHTS_CALL_TIMEOUT_MS,
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

      // Path A — Qloo-native candidate ranking for catalogue rows with verified entity IDs
      let nativeRecs: Awaited<ReturnType<typeof rankQlooIndexedCandidates>>["recommendations"] =
        [];
      if (!this.sampleDataMode && this.qloo.hasCredentials() && profile.resolvedEntities.length) {
        try {
          const native = await rankQlooIndexedCandidates({
            qloo: this.qloo,
            profile,
            entries: this.catalogue.list({
              city: profile.city,
              budgetCop: profile.budgetCop,
              includeDemonstration: false,
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
      }

      // Path B — Bragi evidence-aware matching (includes creators without Qloo IDs)
      let catalogueRecs = this.catalogue.match(profile, 5, {
        includeDemonstration: this.sampleDataMode,
      });
      if (catalogueRecs.length === 0 && !this.sampleDataMode) {
        catalogueRecs = this.catalogue.match(profile, 5, {
          includeDemonstration: true,
        });
        if (catalogueRecs.length > 0) {
          warnings.push(
            "Only demonstration catalogue entries met the evidence threshold; verified venues did not.",
          );
        }
      }

      const recommendations = mergeRankingPaths(nativeRecs, catalogueRecs, 3);
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

/** Choose Insights calls from intermediate resolution results — not a fixed always-on list. */
export function planInsights(
  signals: ReturnType<typeof parseDiscoverInput>["signals"],
  resolved: QlooEntity[],
  city: string,
): InsightPlan[] {
  const plan: InsightPlan[] = [];
  const kinds = new Set(signals.map((s) => s.kind));
  const text = signals.map((s) => s.raw.toLowerCase()).join(" ");

  const hasMusic =
    /\b(radiohead|jazz|reggaeton|salsa|bunny|balvin|music|rock|hip hop|dance)\b/i.test(text) ||
    resolved.some((e) => /artist|music/i.test(e.type ?? "") || /radiohead|balvin|bunny|davis|jazz/i.test(e.name));

  const hasFilmVisual =
    /\b(ghibli|movie|film|anime|totoro|spirited)\b/i.test(text) ||
    resolved.some((e) => /ghibli|spirited|totoro/i.test(e.name));

  const hasFashionBrand =
    /\b(fashion|nike|brand|urban fashion|streetwear)\b/i.test(text);

  if (hasMusic || resolved.length > 0) {
    plan.push({
      filterType: "urn:entity:artist",
      reason: "cross-domain / same-domain music affinities",
    });
  }

  if (hasFilmVisual) {
    plan.push({
      filterType: "urn:entity:movie",
      reason: "film/animation taste expansion",
    });
  }

  if (hasFashionBrand || kinds.has("genre_or_theme")) {
    plan.push({
      filterType: "urn:entity:brand",
      reason: "brand/lifestyle affinities for cultural matching",
    });
  }

  // Places only when we have solid entity signals — Medellín inventory is sparse/noisy for creatives.
  if (resolved.length > 0 && city.toLowerCase().includes("medell")) {
    plan.push({
      filterType: "urn:entity:place",
      locationQuery: city,
      reason: "location-filtered place affinities (matched carefully against catalogue)",
    });
  }

  // Ensure at least one insights call when we have entities
  if (plan.length === 0 && resolved.length > 0) {
    plan.push({
      filterType: "urn:entity:artist",
      reason: "default affinity probe from resolved entities",
    });
  }

  // Keep the plan short — Insights latency on hackathon API can exceed 15s per call.
  return plan.slice(0, 3);
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
