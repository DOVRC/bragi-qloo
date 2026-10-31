import { describe, expect, it } from "vitest";
import { buildTasteBridge, selectPrimaryBridge } from "@/lib/tasteBridge";
import type { DiscoverSuccess, Recommendation } from "@/lib/types";

function baseRec(over: Partial<Recommendation> = {}): Recommendation {
  return {
    entry: {
      id: "creator-ferales",
      name: "Ferales",
      summary: "Medellín alt rock",
      category: "music",
      neighborhood: "Medellín",
      city: "Medellín",
      tags: ["alternative rock"],
      culturalHooks: ["alternative rock"],
      provenance: "verified_public",
      publicUrl: "https://www.feralesmusica.com/epk",
      actionHint: "EPK",
      kind: "creator",
    },
    score: 20,
    explanation: "why",
    judgeExplanation: "judge",
    evidence: [
      {
        source: "user_signal",
        detail: 'Your interest “Radiohead” overlaps catalogue hooks (application-layer, not a Qloo Insights result).',
      },
      {
        source: "qloo_insights",
        entityId: "aff-1",
        entityName: "alternative rock",
        detail: 'Qloo Insights affinity “alternative rock” supports this catalogue match.',
      },
      { source: "catalogue", detail: "verified" },
    ],
    evidenceStrength: "qloo_backed_affinity",
    contributions: [
      { kind: "user_signal", label: "Radiohead", points: 2 },
      { kind: "qloo_insights_entity", label: "alternative rock", id: "aff-1", points: 6 },
      { kind: "catalogue", label: "Verified creator", points: 1.5 },
    ],
    matchedAffinityIds: ["aff-1"],
    qlooInsightsPoints: 6,
    qlooSearchPoints: 0,
    userSignalPoints: 2,
    refinementSuggestions: [],
    rankingPath: "bragi_catalogue",
    ...over,
  };
}

function success(recs: Recommendation[]): DiscoverSuccess {
  return {
    ok: true,
    mode: "live",
    profile: {
      city: "Medellín",
      signals: [{ raw: "Radiohead", kind: "named_entity" }],
      resolvedEntities: [{ id: "e1", name: "Radiohead", type: "urn:entity:artist" }],
      affinityEntities: [{ id: "aff-1", name: "alternative rock" }],
      affinityTags: [],
      evidence: [],
    },
    recommendations: recs,
    steps: [],
    warnings: [],
    trace: {
      requestId: "t",
      mode: "live",
      userSignals: ["Radiohead"],
      resolvedEntities: [],
      discoveredAffinities: [],
      themeTags: [],
      matchedCatalogueIds: [],
      selectedRecommendationIds: [],
      evidenceCoverage: {
        searchEntities: 1,
        insightEntities: 1,
        insightTags: 0,
        recommendationsWithInsights: 1,
        recommendationsDirectOnly: 0,
      },
      steps: [],
      warnings: [],
    },
  };
}

describe("buildTasteBridge", () => {
  it("builds an evidence-backed bridge without inventing hops", () => {
    const result = success([baseRec()]);
    const bridge = buildTasteBridge(result, result.recommendations[0]);
    expect(bridge).not.toBeNull();
    expect(bridge!.steps.map((s) => s.kind)).toEqual([
      "user_interest",
      "qloo_affinity",
      "bragi_match",
      "portfolio",
    ]);
    expect(bridge!.steps.find((s) => s.kind === "bragi_match")?.label).toBe("Ferales");
    expect(bridge!.complete).toBe(true);
  });

  it("refuses a bridge with no supporting contributions", () => {
    const empty = baseRec({
      contributions: [],
      evidence: [],
      matchedAffinityIds: [],
      qlooInsightsPoints: 0,
      userSignalPoints: 0,
      rankingPath: "bragi_catalogue",
    });
    const result = success([empty]);
    expect(buildTasteBridge(result, empty)).toBeNull();
  });

  it("does not invent a Search hop when only Insights evidence exists", () => {
    const result = success([baseRec()]);
    const bridge = buildTasteBridge(result, result.recommendations[0]);
    expect(bridge!.steps.some((s) => s.kind === "qloo_resolved")).toBe(false);
    expect(bridge!.steps.some((s) => s.kind === "qloo_affinity")).toBe(true);
  });

  it("selectPrimaryBridge prefers creator bridges", () => {
    const venue = baseRec({
      entry: {
        id: "teatro-pablo-tobon",
        name: "Teatro Pablo Tobón Uribe",
        summary: "theatre",
        category: "performance",
        neighborhood: "Centro",
        city: "Medellín",
        tags: [],
        culturalHooks: [],
        provenance: "verified_public",
        publicUrl: "https://www.teatropablotobon.com/",
        actionHint: "calendar",
        kind: "venue",
      },
      rankingPath: "qloo_native",
      qlooNativeAffinity: 0.7,
      contributions: [
        { kind: "qloo_native_affinity", label: "Teatro Pablo Tobón Uribe", points: 0, qlooScore: 0.7 },
      ],
      evidence: [
        {
          source: "qloo_insights",
          detail: "native",
        },
      ],
    });
    const creator = baseRec();
    const result = success([venue, creator]);
    const primary = selectPrimaryBridge(result);
    expect(primary?.recommendationId).toBe("creator-ferales");
  });
});
