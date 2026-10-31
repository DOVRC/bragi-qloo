import { CatalogueService, MIN_MATCH_SCORE } from "@/lib/catalogue/service";
import type {
  CatalogueKind,
  DiscoverSuccess,
  DiscoveryIntent,
  Recommendation,
} from "@/lib/types";

/** Keep in sync with `kindsForIntent` in discovery agent (avoid importing the agent into client). */
function kindsForIntent(intent: DiscoveryIntent): CatalogueKind[] | undefined {
  if (intent === "creators") return ["creator", "project"];
  if (intent === "places") return ["venue"];
  return undefined;
}

export interface QlooDeltaOptions {
  /** Same discovery intent as the run that produced `result`. */
  intent?: DiscoveryIntent;
  /** Catalogue ids excluded by Not my style (same as the discover request). */
  excludeEntryIds?: string[];
  /** Final UI slot count — default matches discovery merge limit (3). */
  limit?: number;
}

export interface QlooDeltaSummary {
  /** Path B user-signal-only matches under the same constraints as discovery. */
  baselineIds: string[];
  baselineNames: string[];
  /**
   * Path B full (Search + Insights + user) under the same constraints —
   * isolates Qloo evidence contribution without native Path A / merge effects.
   */
  pathBEnrichedIds: string[];
  pathBEnrichedNames: string[];
  /** Actual UI recommendations (may include Qloo-native Path A). */
  enrichedIds: string[];
  enrichedNames: string[];
  newAffinityNames: string[];
  resolvedNames: string[];
  /** Surfaced by Path B full vs user-only — attributable to Search/Insights evidence. */
  newlySurfacedByQlooEvidence: string[];
  /** In the UI set but not in the comparable user-only baseline. */
  newlySurfacedInUi: string[];
  sharedNames: string[];
  displacedBaselineNames: string[];
  qlooDependentNames: string[];
  directCatalogueNames: string[];
  /** UI ids that are native Path A and not in Path B full — selection-rule difference. */
  nativeOnlyInUi: string[];
  rankingChanged: boolean;
  constraints: {
    city: string;
    budgetCop?: number;
    intent: DiscoveryIntent;
    kinds?: CatalogueKind[];
    excludeEntryIds: string[];
    minScore: number;
    limit: number;
  };
  note: string;
  comparabilityNote: string;
}

/**
 * Compare user-signal-only catalogue matching vs Qloo-enriched Path B and the UI set.
 * Uses the same TasteProfile already returned — no extra Qloo API calls.
 */
export function computeQlooDelta(
  result: DiscoverSuccess,
  catalogue = new CatalogueService(),
  options: QlooDeltaOptions = {},
): QlooDeltaSummary {
  const intent = options.intent ?? inferIntent(result);
  const kinds = kindsForIntent(intent);
  const exclude = new Set(options.excludeEntryIds ?? inferExcludeIds(result));
  const limit = options.limit ?? 3;
  const includeDemonstration = result.mode === "sample";

  const matchOpts = {
    includeDemonstration,
    kinds,
    minScore: MIN_MATCH_SCORE,
  } as const;

  const baseline = catalogue
    .match(result.profile, Math.max(limit, 5), { ...matchOpts, mode: "user_only" })
    .filter((r) => !exclude.has(r.entry.id))
    .slice(0, limit);

  const pathBEnriched = catalogue
    .match(result.profile, Math.max(limit, 5), { ...matchOpts, mode: "full" })
    .filter((r) => !exclude.has(r.entry.id))
    .slice(0, limit);

  const baselineIds = baseline.map((r) => r.entry.id);
  const baselineNames = baseline.map((r) => r.entry.name);
  const pathBEnrichedIds = pathBEnriched.map((r) => r.entry.id);
  const pathBEnrichedNames = pathBEnriched.map((r) => r.entry.name);

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
  const pathBSet = new Set(pathBEnrichedIds);

  const newlySurfacedByQlooEvidence = pathBEnriched
    .filter((r) => !baselineSet.has(r.entry.id))
    .map((r) => r.entry.name);

  const newlySurfacedInUi = enriched
    .filter((r) => !baselineSet.has(r.entry.id))
    .map((r) => r.entry.name);

  const sharedNames = enriched
    .filter((r) => baselineSet.has(r.entry.id))
    .map((r) => r.entry.name);

  const displacedBaselineNames = baseline
    .filter((r) => !pathBSet.has(r.entry.id))
    .map((r) => r.entry.name);

  const qlooDependentNames = enriched.filter(isQlooDependent).map((r) => r.entry.name);
  const directCatalogueNames = enriched
    .filter((r) => !isQlooDependent(r))
    .map((r) => r.entry.name);

  const nativeOnlyInUi = enriched
    .filter((r) => r.rankingPath === "qloo_native" && !pathBSet.has(r.entry.id))
    .map((r) => r.entry.name);

  const rankingChanged =
    newlySurfacedByQlooEvidence.length > 0 ||
    displacedBaselineNames.length > 0 ||
    !sameOrder(baselineIds, pathBEnrichedIds);

  let note: string;
  if (baseline.length === 0 && pathBEnriched.length === 0) {
    note = "Neither Path B view returned catalogue matches above the evidence threshold.";
  } else if (!rankingChanged) {
    note =
      "Path B top identities overlap heavily with direct signal matching. Qloo still contributed resolved entities and affinities listed below.";
  } else if (newlySurfacedByQlooEvidence.length > 0) {
    note =
      "Under the same city, intent, budget, exclusions, and score floor, Search/Insights evidence changed which catalogue identities clear Path B.";
  } else {
    note = "Path B ordering differs once Search / Insights evidence is included.";
  }

  const comparabilityParts = [
    `Comparable Path B baseline uses intent=${intent}, city=${result.profile.city}, minScore=${MIN_MATCH_SCORE}, limit=${limit}.`,
  ];
  if (kinds?.length) {
    comparabilityParts.push(`Kind filter: ${kinds.join(", ")}.`);
  }
  if (exclude.size) {
    comparabilityParts.push(`Excluded ${exclude.size} catalogue id(s) (Not my style).`);
  }
  if (nativeOnlyInUi.length) {
    comparabilityParts.push(
      `UI also includes Qloo-native place ranking not present in Path B alone: ${nativeOnlyInUi.join(", ")}.`,
    );
  } else if (
    enriched.some((r) => r.rankingPath === "qloo_native") &&
    newlySurfacedInUi.some((n) => !newlySurfacedByQlooEvidence.includes(n))
  ) {
    comparabilityParts.push(
      "UI merge order may differ from Path B-only ordering even when identities overlap.",
    );
  }
  comparabilityParts.push(
    "Newly surfaced by Qloo evidence compares Path B full vs user-only — not inflated by softer thresholds.",
  );

  return {
    baselineIds,
    baselineNames,
    pathBEnrichedIds,
    pathBEnrichedNames,
    enrichedIds,
    enrichedNames,
    newAffinityNames,
    resolvedNames: result.profile.resolvedEntities.map((e) => e.name),
    newlySurfacedByQlooEvidence,
    newlySurfacedInUi,
    sharedNames,
    displacedBaselineNames,
    qlooDependentNames,
    directCatalogueNames,
    nativeOnlyInUi,
    rankingChanged,
    constraints: {
      city: result.profile.city,
      budgetCop: result.profile.budgetCop,
      intent,
      kinds,
      excludeEntryIds: [...exclude],
      minScore: MIN_MATCH_SCORE,
      limit,
    },
    note,
    comparabilityNote: comparabilityParts.join(" "),
  };
}

/** Prefer explicit options; fall back to discover warnings / UI kinds. */
export function inferIntent(result: DiscoverSuccess): DiscoveryIntent {
  if (result.warnings.some((w) => /Creators intent/i.test(w))) return "creators";
  if (result.warnings.some((w) => /Places intent|places-only/i.test(w))) return "places";
  const kinds = new Set(
    result.recommendations.map((r) => r.entry.kind ?? "venue"),
  );
  if (kinds.size && [...kinds].every((k) => k === "creator" || k === "project")) {
    return "creators";
  }
  if (kinds.size && [...kinds].every((k) => k === "venue")) {
    return "places";
  }
  return "mixed";
}

function inferExcludeIds(result: DiscoverSuccess): string[] {
  // Warnings only report counts; exclusions are already applied to `recommendations`.
  // Baseline must not re-introduce ids absent from the UI for other reasons — only
  // apply exclusions when the discover warning confirms feedback exclusions.
  if (!result.warnings.some((w) => /Excluded \d+ catalogue id/i.test(w))) {
    return [];
  }
  return [];
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
