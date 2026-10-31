import {
  normalizeAggregateExplainability,
  normalizeCandidateExplainability,
  type AggregateExplainability,
  type CandidateExplainability,
} from "@/lib/qloo/explainability";
import type { QlooService } from "@/lib/qloo/client";
import {
  domainFromCatalogueCategory,
  domainsFromSignals,
  hasTraceableDomainChange,
  type CulturalDomain,
} from "@/lib/domains";
import type {
  CatalogueEntry,
  MatchContribution,
  QlooEntity,
  Recommendation,
  TasteEvidence,
  TasteProfile,
} from "@/lib/types";

export interface NativeRankResult {
  recommendations: Recommendation[];
  warnings: string[];
  indexedCandidateCount: number;
  returnedCandidateCount: number;
  /** Result-set explainability — not candidate-specific */
  aggregateExplainability?: AggregateExplainability;
  /** Wall time for native Insights call(s) */
  elapsedMs?: number;
}

/**
 * Path A — evaluate catalogue entries that have verified Qloo entity IDs
 * via Insights `filter.results.entities` (+ optional explainability).
 *
 * Ranking uses `entity.query.affinity` when present — never `popularity`.
 */
export async function rankQlooIndexedCandidates(args: {
  qloo: QlooService;
  profile: TasteProfile;
  entries: CatalogueEntry[];
  limit?: number;
}): Promise<NativeRankResult> {
  const { qloo, profile, entries } = args;
  const limit = args.limit ?? 3;
  const warnings: string[] = [];
  const started = Date.now();

  const indexed = entries.filter((e) => e.qlooEntityId && e.qlooEntityType);
  if (indexed.length === 0) {
    return {
      recommendations: [],
      warnings: ["No catalogue entries carry verified Qloo entity IDs."],
      indexedCandidateCount: 0,
      returnedCandidateCount: 0,
      elapsedMs: Date.now() - started,
    };
  }

  if (profile.resolvedEntities.length === 0) {
    return {
      recommendations: [],
      warnings: ["Native candidate ranking skipped — no resolved Search entities."],
      indexedCandidateCount: indexed.length,
      returnedCandidateCount: 0,
      elapsedMs: Date.now() - started,
    };
  }

  const byType = new Map<string, CatalogueEntry[]>();
  for (const entry of indexed) {
    const t = entry.qlooEntityType ?? "urn:entity:place";
    const list = byType.get(t) ?? [];
    list.push(entry);
    byType.set(t, list);
  }

  const sourceDomains = domainsFromSignals(
    profile.signals,
    profile.resolvedEntities.map((e) => e.type),
  );

  const scored: Recommendation[] = [];
  let aggregateExplainability: AggregateExplainability | undefined;

  // One Insights call per filter.type group (bounded — typically a single place group).
  for (const [filterType, group] of byType) {
    try {
      const result = await qloo.getInsights({
        filterType,
        signalEntityIds: profile.resolvedEntities.map((e) => e.id),
        resultEntityIds: group.map((e) => e.qlooEntityId!),
        explainability: true,
        take: Math.min(group.length, 8),
        timeoutMs: 20_000,
      });

      const byId = new Map(result.entities.map((e) => [e.id.toLowerCase(), e]));
      const aggregate = normalizeAggregateExplainability(result.raw);
      if (!aggregateExplainability && (aggregate.available || aggregate.warning)) {
        aggregateExplainability = aggregate;
      }

      for (const entry of group) {
        const hit = byId.get(entry.qlooEntityId!.toLowerCase());
        if (!hit) continue;

        // Candidate-only explainability — never fall back to aggregate contributions.
        const candidateExpl = normalizeCandidateExplainability(hit.raw ?? hit);
        const affinity =
          typeof hit.affinity === "number" && !Number.isNaN(hit.affinity)
            ? hit.affinity
            : undefined;

        scored.push(
          buildNativeRecommendation({
            entry,
            hit,
            affinity,
            popularity:
              typeof hit.popularity === "number" && !Number.isNaN(hit.popularity)
                ? hit.popularity
                : undefined,
            candidateExplainability: candidateExpl,
            profile,
            sourceDomains,
          }),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Insights native ranking failed";
      warnings.push(`Native Insights (${filterType}): ${message}`);
    }
  }

  // Sort by true affinity when present; do not use popularity as a stand-in.
  const withAffinity = scored.filter((r) => r.qlooNativeAffinity != null);
  const withoutAffinity = scored.filter((r) => r.qlooNativeAffinity == null);
  withAffinity.sort((a, b) => (b.qlooNativeAffinity ?? 0) - (a.qlooNativeAffinity ?? 0));
  withoutAffinity.sort((a, b) => a.entry.name.localeCompare(b.entry.name));
  if (withoutAffinity.length > 0) {
    warnings.push(
      `${withoutAffinity.length} native candidate(s) lacked query.affinity — retained without numeric affinity sort.`,
    );
  }
  const ordered = [...withAffinity, ...withoutAffinity];

  return {
    recommendations: ordered.slice(0, limit),
    warnings,
    indexedCandidateCount: indexed.length,
    returnedCandidateCount: scored.length,
    aggregateExplainability,
    elapsedMs: Date.now() - started,
  };
}

function buildNativeRecommendation(args: {
  entry: CatalogueEntry;
  hit: QlooEntity;
  affinity?: number;
  popularity?: number;
  candidateExplainability: CandidateExplainability;
  profile: TasteProfile;
  sourceDomains: CulturalDomain[];
}): Recommendation {
  const { entry, hit, affinity, popularity, candidateExplainability, profile, sourceDomains } =
    args;
  const resultDomain = domainFromCatalogueCategory(entry.category);
  const established = hasTraceableDomainChange(sourceDomains, resultDomain);

  const contributions: MatchContribution[] = [
    {
      kind: "qloo_native_affinity",
      label: hit.name,
      id: hit.id,
      points: 0,
      qlooScore: affinity,
    },
  ];

  const nameById = new Map(profile.resolvedEntities.map((e) => [e.id.toLowerCase(), e.name]));
  if (candidateExplainability.available) {
    for (const c of candidateExplainability.contributions.slice(0, 6)) {
      const entityName =
        (c.entityId && nameById.get(c.entityId.toLowerCase())) ||
        profile.resolvedEntities[Number(c.key)]?.name;
      contributions.push({
        kind: "qloo_explainability",
        label: entityName ?? c.entityId ?? `input:${c.key}`,
        id: c.entityId,
        points: 0,
        qlooScore: c.score,
      });
    }
  }

  const evidence: TasteEvidence[] = [
    {
      source: "qloo_insights",
      entityId: hit.id,
      entityName: hit.name,
      detail:
        affinity != null
          ? `Qloo Insights candidate (filter.results.entities) with query.affinity ${affinity.toFixed(3)}${
              popularity != null ? ` (popularity ${popularity.toFixed(3)} is separate)` : ""
            }.`
          : `Qloo Insights returned this candidate via filter.results.entities; query.affinity was not present — no numeric native rank advertised.`,
    },
  ];

  if (candidateExplainability.available) {
    for (const c of candidateExplainability.contributions.slice(0, 4)) {
      const entityName =
        (c.entityId && nameById.get(c.entityId.toLowerCase())) ||
        profile.resolvedEntities[Number(c.key)]?.name;
      evidence.push({
        source: "qloo_insights",
        entityId: c.entityId,
        entityName,
        detail: `Candidate explainability: input “${entityName ?? c.key}” contributed${
          c.score != null ? ` (score ${c.score.toFixed(2)})` : ""
        }.`,
      });
    }
  } else if (candidateExplainability.warning) {
    evidence.push({
      source: "qloo_insights",
      detail: `Candidate explainability warning: ${candidateExplainability.warning}`,
    });
  }

  evidence.push({
    source: "catalogue",
    detail:
      entry.kind === "creator" || entry.kind === "project"
        ? "Bragi catalogue: verified public creator/project profile."
        : "Bragi catalogue: verified public venue/program.",
  });

  const evidenceStrength = established
    ? ("cross_domain_affinity" as const)
    : ("qloo_backed_affinity" as const);

  const interests = profile.signals
    .map((s) => s.raw)
    .slice(0, 3)
    .join(", ");

  const explanation =
    affinity != null
      ? established
        ? `You selected ${interests}. Qloo Insights scored “${hit.name}” with contextual affinity ${affinity.toFixed(2)} across cultural domains — Bragi surfaces the matching Medellín ${entry.kind === "creator" ? "creator" : "place"}.`
        : `You selected ${interests}. Qloo Insights scored “${hit.name}” with contextual affinity ${affinity.toFixed(2)}. This is Qloo-backed ranking (not popularity, not a Bragi keyword score).`
      : `You selected ${interests}. Qloo Insights returned “${hit.name}” as a candidate for your signals. Contextual affinity was not provided for this entity, so Bragi does not invent a numeric native score.`;

  return {
    entry,
    score: 0,
    explanation,
    judgeExplanation: [
      `path=qloo_native`,
      `strength=${evidenceStrength}`,
      `query.affinity=${affinity ?? "n/a"}`,
      `popularity=${popularity ?? "n/a"}`,
      `domainChange=${established}`,
      `candidateExplainability=${candidateExplainability.available}`,
      `qlooId=${hit.id}`,
    ].join("; "),
    evidence,
    evidenceStrength,
    contributions,
    matchedAffinityIds: [hit.id],
    qlooInsightsPoints: 0,
    qlooSearchPoints: 0,
    userSignalPoints: 0,
    refinementSuggestions: [
      "Compare with catalogue-matched places that are not yet indexed in Qloo.",
      "Change interests to see how Qloo re-ranks the same candidates.",
    ],
    rankingPath: "qloo_native",
    qlooNativeAffinity: affinity,
    qlooExplainability: {
      scope: "candidate",
      available: candidateExplainability.available,
      warning: candidateExplainability.warning,
      contributions: candidateExplainability.contributions.map((c) => ({
        key: c.key,
        entityId: c.entityId,
        entityName:
          (c.entityId && nameById.get(c.entityId.toLowerCase())) ||
          profile.resolvedEntities[Number(c.key)]?.name,
        score: c.score,
      })),
    },
    domainChangeEstablished: established,
  };
}

/** Merge Path A (native) + Path B (catalogue) without equating score scales. */
export function mergeRankingPaths(
  native: Recommendation[],
  catalogue: Recommendation[],
  limit = 3,
): Recommendation[] {
  const seen = new Set<string>();
  const out: Recommendation[] = [];

  for (const r of native) {
    if (seen.has(r.entry.id)) continue;
    seen.add(r.entry.id);
    out.push(r);
    if (out.length >= limit) return out;
  }

  for (const r of catalogue) {
    if (seen.has(r.entry.id)) continue;
    seen.add(r.entry.id);
    out.push(r);
    if (out.length >= limit) break;
  }

  return out;
}
