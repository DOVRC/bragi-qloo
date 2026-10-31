import { normalizeExplainability } from "@/lib/qloo/explainability";
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
}

/**
 * Path A — evaluate catalogue entries that have verified Qloo entity IDs
 * via Insights `filter.results.entities` (+ optional explainability).
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

  const indexed = entries.filter((e) => e.qlooEntityId && e.qlooEntityType);
  if (indexed.length === 0) {
    return {
      recommendations: [],
      warnings: ["No catalogue entries carry verified Qloo entity IDs."],
      indexedCandidateCount: 0,
      returnedCandidateCount: 0,
    };
  }

  if (profile.resolvedEntities.length === 0) {
    return {
      recommendations: [],
      warnings: ["Native candidate ranking skipped — no resolved Search entities."],
      indexedCandidateCount: indexed.length,
      returnedCandidateCount: 0,
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

  for (const [filterType, group] of byType) {
    try {
      const result = await qloo.getInsights({
        filterType,
        signalEntityIds: profile.resolvedEntities.map((e) => e.id),
        resultEntityIds: group.map((e) => e.qlooEntityId!),
        explainability: true,
        take: Math.min(group.length, 8),
      });

      const byId = new Map(result.entities.map((e) => [e.id.toLowerCase(), e]));
      const topExpl = normalizeExplainability(result.raw);

      for (const entry of group) {
        const hit = byId.get(entry.qlooEntityId!.toLowerCase());
        if (!hit) continue;

        const entityExpl = normalizeExplainability(hit.raw ?? hit);
        const expl = entityExpl.available ? entityExpl : topExpl;
        const affinity =
          typeof hit.popularity === "number" && !Number.isNaN(hit.popularity)
            ? hit.popularity
            : undefined;

        scored.push(
          buildNativeRecommendation({
            entry,
            hit,
            affinity,
            explainability: expl,
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

  scored.sort((a, b) => {
    const na = a.qlooNativeAffinity ?? 0;
    const nb = b.qlooNativeAffinity ?? 0;
    if (nb !== na) return nb - na;
    return a.entry.name.localeCompare(b.entry.name);
  });

  return {
    recommendations: scored.slice(0, limit),
    warnings,
    indexedCandidateCount: indexed.length,
    returnedCandidateCount: scored.length,
  };
}

function buildNativeRecommendation(args: {
  entry: CatalogueEntry;
  hit: QlooEntity;
  affinity?: number;
  explainability: ReturnType<typeof normalizeExplainability>;
  profile: TasteProfile;
  sourceDomains: CulturalDomain[];
}): Recommendation {
  const { entry, hit, affinity, explainability, profile, sourceDomains } = args;
  const resultDomain = domainFromCatalogueCategory(entry.category);
  // Prefer signal→catalogue domain change (e.g. music tastes → place/venue)
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
  for (const c of explainability.contributions.slice(0, 6)) {
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

  const evidence: TasteEvidence[] = [
    {
      source: "qloo_insights",
      entityId: hit.id,
      entityName: hit.name,
      detail: `Qloo Insights evaluated this catalogue entry as a candidate (filter.results.entities)${
        affinity != null ? ` with native affinity ${affinity.toFixed(3)}` : ""
      }.`,
    },
  ];

  if (explainability.available) {
    for (const c of explainability.contributions.slice(0, 4)) {
      const entityName =
        (c.entityId && nameById.get(c.entityId.toLowerCase())) ||
        profile.resolvedEntities[Number(c.key)]?.name;
      evidence.push({
        source: "qloo_insights",
        entityId: c.entityId,
        entityName,
        detail: `Qloo explainability: input “${entityName ?? c.key}” contributed${
          c.score != null ? ` (score ${c.score.toFixed(2)})` : ""
        }.`,
      });
    }
  } else if (explainability.warning) {
    evidence.push({
      source: "qloo_insights",
      detail: `Qloo explainability unavailable: ${explainability.warning}`,
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

  const explanation = established
    ? `You selected ${interests}. Qloo Insights ranked “${hit.name}” among your candidate affinities across cultural domains — Bragi surfaces the matching Medellín ${entry.kind === "creator" ? "creator" : "place"} with that native evidence.`
    : `You selected ${interests}. Qloo Insights returned a native affinity for “${hit.name}” among verified candidates. This is Qloo-backed ranking, not a Bragi keyword score.`;

  return {
    entry,
    score: 0,
    explanation,
    judgeExplanation: [
      `path=qloo_native`,
      `strength=${evidenceStrength}`,
      `nativeAffinity=${affinity ?? "n/a"}`,
      `domainChange=${established}`,
      `explainability=${explainability.available}`,
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
      available: explainability.available,
      warning: explainability.warning,
      contributions: explainability.contributions.map((c) => ({
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
