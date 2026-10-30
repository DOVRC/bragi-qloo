import { humanizeTagId } from "@/lib/qloo/normalize";
import type {
  AffinityNode,
  AgentStep,
  DiscoveryTrace,
  QlooEntity,
  Recommendation,
  TasteProfile,
} from "@/lib/types";

export function buildDiscoveryTrace(args: {
  requestId?: string;
  mode: "live" | "sample";
  profile: TasteProfile;
  recommendations: Recommendation[];
  steps: AgentStep[];
  warnings: string[];
}): DiscoveryTrace {
  const { mode, profile, recommendations, steps, warnings } = args;
  const signalNames = profile.signals.map((s) => s.raw.toLowerCase());
  const resolvedNames = new Set(profile.resolvedEntities.map((e) => e.name.toLowerCase()));

  const resolvedEntities: AffinityNode[] = profile.resolvedEntities.map((e) => ({
    id: e.id,
    name: e.name,
    source: "qloo_search" as const,
    categoryHint: categoryFromType(e.type),
    originatingSignals: profile.signals
      .filter((s) => namesClose(s.raw, e.name))
      .map((s) => s.raw),
    kind: "direct" as const,
  }));

  const discoveredAffinities: AffinityNode[] = profile.affinityEntities
    .filter((e) => {
      const n = e.name.toLowerCase();
      return !resolvedNames.has(n) && !signalNames.includes(n);
    })
    .slice(0, 12)
    .map((e) => ({
      id: e.id,
      name: e.name,
      source: "qloo_insights" as const,
      categoryHint: categoryFromType(e.type),
      kind: "inferred" as const,
    }));

  const themeTags = profile.affinityTags
    .map(humanizeTagId)
    .filter((t) => t.length >= 3 && !signalNames.includes(t.toLowerCase()))
    .slice(0, 10);

  const withInsights = recommendations.filter((r) => r.qlooInsightsPoints > 0).length;
  const directOnly = recommendations.filter(
    (r) => r.qlooInsightsPoints === 0 && r.qlooSearchPoints > 0,
  ).length;

  return {
    requestId: args.requestId ?? `disc_${Date.now().toString(36)}`,
    mode,
    userSignals: profile.signals.map((s) => s.raw),
    resolvedEntities,
    discoveredAffinities,
    themeTags,
    matchedCatalogueIds: recommendations.map((r) => r.entry.id),
    selectedRecommendationIds: recommendations.map((r) => r.entry.id),
    evidenceCoverage: {
      searchEntities: profile.resolvedEntities.length,
      insightEntities: profile.affinityEntities.length,
      insightTags: profile.affinityTags.length,
      recommendationsWithInsights: withInsights,
      recommendationsDirectOnly: directOnly,
    },
    steps,
    warnings,
  };
}

function categoryFromType(type?: string): string | undefined {
  if (!type) return undefined;
  if (/artist|music/i.test(type)) return "music";
  if (/movie|film|tv/i.test(type)) return "film";
  if (/brand/i.test(type)) return "brand";
  if (/place|destination|locality/i.test(type)) return "place";
  return undefined;
}

function namesClose(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.includes(y) || y.includes(x);
}

/** Sanitize entities for client — strip raw payloads. */
export function sanitizeEntity(e: QlooEntity): QlooEntity {
  return {
    id: e.id,
    name: e.name,
    type: e.type,
    popularity: e.popularity,
  };
}
