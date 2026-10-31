import { CatalogueService } from "@/lib/catalogue/service";
import type { DiscoverSuccess, Recommendation } from "@/lib/types";

export interface QlooDeltaSummary {
  /** Catalogue matches using only raw user signals (no Search/Insights). */
  baselineIds: string[];
  baselineNames: string[];
  /** Actual recommendations from the discovery response. */
  enrichedIds: string[];
  enrichedNames: string[];
  /** Entities Insights returned that were not in the user signal set. */
  newAffinityNames: string[];
  /** Resolved Search entities for transparency. */
  resolvedNames: string[];
  /** Present in enriched path but not in user-only baseline. */
  newlySurfacedNames: string[];
  /** Present in both paths. */
  sharedNames: string[];
  /** Present in baseline only (displaced when Qloo evidence is used). */
  displacedBaselineNames: string[];
  /** Enriched recs that carry Insights/Search/native Qloo contributions. */
  qlooDependentNames: string[];
  /** Enriched recs that are primarily user-signal / catalogue overlap. */
  directCatalogueNames: string[];
  rankingChanged: boolean;
  note: string;
}

/**
 * Compare user-signal-only catalogue matching vs the actual Qloo-enriched result.
 * Uses the same TasteProfile already returned — no extra Qloo API calls.
 */
export function computeQlooDelta(
  result: DiscoverSuccess,
  catalogue = new CatalogueService(),
): QlooDeltaSummary {
  // Softer floor so keyword-only overlaps remain visible for comparison;
  // production ranking still uses MIN_MATCH_SCORE via the discovery agent.
  const baseline = catalogue.match(result.profile, 5, {
    includeDemonstration: result.mode === "sample",
    mode: "user_only",
    minScore: 3,
  });

  const baselineIds = baseline.map((r) => r.entry.id);
  const baselineNames = baseline.map((r) => r.entry.name);
  const enriched = result.recommendations;
  const enrichedIds = enriched.map((r) => r.entry.id);
  const enrichedNames = enriched.map((r) => r.entry.name);

  const signalSet = new Set(result.profile.signals.map((s) => s.raw.toLowerCase()));
  const resolvedSet = new Set(
    result.profile.resolvedEntities.map((e) => e.name.toLowerCase()),
  );

  const newAffinityNames = result.profile.affinityEntities
    .map((e) => e.name)
    .filter((n) => {
      const key = n.toLowerCase();
      return !signalSet.has(key) && !resolvedSet.has(key);
    })
    .slice(0, 12);

  const baselineSet = new Set(baselineIds);
  const enrichedSet = new Set(enrichedIds);

  const newlySurfacedNames = enriched
    .filter((r) => !baselineSet.has(r.entry.id))
    .map((r) => r.entry.name);

  const sharedNames = enriched
    .filter((r) => baselineSet.has(r.entry.id))
    .map((r) => r.entry.name);

  const displacedBaselineNames = baseline
    .filter((r) => !enrichedSet.has(r.entry.id))
    .map((r) => r.entry.name);

  const qlooDependentNames = enriched.filter(isQlooDependent).map((r) => r.entry.name);
  const directCatalogueNames = enriched
    .filter((r) => !isQlooDependent(r))
    .map((r) => r.entry.name);

  const rankingChanged =
    newlySurfacedNames.length > 0 ||
    displacedBaselineNames.length > 0 ||
    !sameOrder(baselineIds, enrichedIds);

  let note: string;
  if (baseline.length === 0 && enriched.length === 0) {
    note = "Neither path returned catalogue matches above the evidence threshold.";
  } else if (!rankingChanged && newlySurfacedNames.length === 0) {
    note =
      "With this input, the top catalogue identities overlap heavily with direct signal matching. Qloo still contributed resolved entities and affinities shown below.";
  } else if (newlySurfacedNames.length > 0) {
    note =
      "Qloo-enriched evidence surfaced catalogue matches that direct user-signal matching alone did not place in the top set.";
  } else {
    note = "Ranking or ordering differs once Search / Insights evidence is included.";
  }

  return {
    baselineIds,
    baselineNames,
    enrichedIds,
    enrichedNames,
    newAffinityNames,
    resolvedNames: result.profile.resolvedEntities.map((e) => e.name),
    newlySurfacedNames,
    sharedNames,
    displacedBaselineNames,
    qlooDependentNames,
    directCatalogueNames,
    rankingChanged,
    note,
  };
}

function isQlooDependent(rec: Recommendation): boolean {
  if (rec.rankingPath === "qloo_native") return true;
  if (rec.qlooInsightsPoints > 0 || rec.qlooSearchPoints > 0) return true;
  return rec.contributions.some((c) => c.kind.startsWith("qloo_"));
}

function sameOrder(a: string[], b: string[]): boolean {
  const n = Math.min(a.length, b.length);
  if (n === 0) return a.length === b.length;
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
