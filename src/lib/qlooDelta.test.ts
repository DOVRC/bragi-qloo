import { describe, expect, it } from "vitest";
import { CatalogueService, MIN_MATCH_SCORE } from "@/lib/catalogue/service";
import { computeQlooDelta } from "@/lib/qlooDelta";
import type { CatalogueEntry, DiscoverSuccess, Recommendation } from "@/lib/types";

const ferales: CatalogueEntry = {
  id: "creator-ferales",
  name: "Ferales",
  summary: "alt",
  category: "music",
  neighborhood: "Medellín",
  city: "Medellín",
  tags: ["alternative rock"],
  culturalHooks: ["alternative rock", "art rock"],
  provenance: "verified_public",
  publicUrl: "https://example.com",
  actionHint: "x",
  kind: "creator",
};

const alcoli: CatalogueEntry = {
  id: "creator-alcolirykoz",
  name: "Alcolirykoz",
  summary: "hip-hop",
  category: "music",
  neighborhood: "Medellín",
  city: "Medellín",
  tags: ["hip-hop"],
  culturalHooks: ["hip hop", "rap"],
  provenance: "verified_public",
  publicUrl: "https://example.com",
  actionHint: "x",
  kind: "creator",
};

const venue: CatalogueEntry = {
  id: "teatro-pablo-tobon",
  name: "Teatro Pablo Tobón Uribe",
  summary: "theatre",
  category: "performance",
  neighborhood: "Centro",
  city: "Medellín",
  tags: ["theatre"],
  culturalHooks: ["jazz", "live music"],
  provenance: "verified_public",
  publicUrl: "https://example.com",
  actionHint: "x",
  kind: "venue",
};

function rec(entry: CatalogueEntry, over: Partial<Recommendation> = {}): Recommendation {
  return {
    entry,
    score: 12,
    explanation: "e",
    judgeExplanation: "j",
    evidence: [{ source: "qloo_insights", detail: "aff" }],
    evidenceStrength: "qloo_backed_affinity",
    contributions: [{ kind: "qloo_insights_entity", label: "alternative rock", points: 6 }],
    matchedAffinityIds: ["a1"],
    qlooInsightsPoints: 6,
    qlooSearchPoints: 0,
    userSignalPoints: 0,
    refinementSuggestions: [],
    rankingPath: "bragi_catalogue",
    ...over,
  };
}

function success(
  recs: Recommendation[],
  profileOver: Partial<DiscoverSuccess["profile"]> = {},
  warnings: string[] = [],
): DiscoverSuccess {
  return {
    ok: true,
    mode: "live",
    profile: {
      city: "Medellín",
      signals: [{ raw: "hip hop", kind: "genre_or_theme" }],
      resolvedEntities: [],
      affinityEntities: [{ id: "a1", name: "alternative rock" }],
      affinityTags: [],
      evidence: [],
      ...profileOver,
    },
    recommendations: recs,
    steps: [],
    warnings,
    trace: {
      requestId: "t",
      mode: "live",
      userSignals: ["hip hop"],
      resolvedEntities: [],
      discoveredAffinities: [],
      themeTags: [],
      matchedCatalogueIds: [],
      selectedRecommendationIds: [],
      evidenceCoverage: {
        searchEntities: 0,
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

describe("computeQlooDelta", () => {
  it("uses the same MIN_MATCH_SCORE floor as Path B discovery", () => {
    const catalogue = new CatalogueService([ferales, alcoli, venue]);
    const result = success([rec(ferales)], undefined, [
      "Creators intent — skipped Qloo-native place ranking so independent creators can surface via catalogue evidence.",
    ]);
    const delta = computeQlooDelta(result, catalogue, { intent: "creators" });
    expect(delta.constraints.minScore).toBe(MIN_MATCH_SCORE);
    expect(delta.constraints.intent).toBe("creators");
    expect(delta.constraints.kinds).toEqual(["creator", "project"]);
    // Venue must not appear in comparable Path B under creators intent
    expect(delta.baselineNames).not.toContain("Teatro Pablo Tobón Uribe");
    expect(delta.pathBEnrichedNames).not.toContain("Teatro Pablo Tobón Uribe");
  });

  it("attributes newly surfaced Path B ids to Qloo evidence, not softer thresholds", () => {
    const catalogue = new CatalogueService([ferales, alcoli]);
    const result = success([rec(ferales)], undefined, ["Creators intent — skipped"]);
    const delta = computeQlooDelta(result, catalogue, { intent: "creators" });
    // Single raw "hip hop" signal alone is below MIN_MATCH_SCORE — baseline empty is honest
    expect(delta.baselineNames).toHaveLength(0);
    // Insights affinity "alternative rock" can clear Path B for Ferales
    expect(delta.pathBEnrichedNames).toContain("Ferales");
    expect(delta.newlySurfacedByQlooEvidence).toContain("Ferales");
    expect(delta.comparabilityNote).toMatch(/minScore=/);
  });

  it("separates native-only UI picks from Path B Qloo evidence", () => {
    const catalogue = new CatalogueService([ferales, venue]);
    const nativeVenue = rec(venue, {
      rankingPath: "qloo_native",
      qlooNativeAffinity: 0.7,
      qlooSearchPoints: 0,
      qlooInsightsPoints: 0,
      contributions: [{ kind: "qloo_native_affinity", label: venue.name, points: 0, qlooScore: 0.7 }],
    });
    const result = success([nativeVenue, rec(ferales)], {
      signals: [{ raw: "alternative rock", kind: "genre_or_theme" }],
      affinityEntities: [{ id: "a1", name: "art rock" }],
    });
    const delta = computeQlooDelta(result, catalogue, { intent: "mixed" });
    expect(delta.enrichedNames).toContain("Teatro Pablo Tobón Uribe");
    // Native UI presence is called out when not explained by Path B alone
    expect(delta.comparabilityNote.length).toBeGreaterThan(20);
  });

  it("respects excludeEntryIds for comparable baseline", () => {
    const catalogue = new CatalogueService([ferales, alcoli]);
    const result = success(
      [rec(ferales)],
      {
        signals: [
          { raw: "alternative rock", kind: "genre_or_theme" },
          { raw: "art rock", kind: "genre_or_theme" },
          { raw: "post-punk", kind: "genre_or_theme" },
        ],
        affinityEntities: [],
        resolvedEntities: [{ id: "e1", name: "Alternative Rock" }],
      },
      ["Excluded 1 catalogue id(s) from feedback (Not my style)."],
    );
    const delta = computeQlooDelta(result, catalogue, {
      intent: "creators",
      excludeEntryIds: ["creator-ferales"],
    });
    expect(delta.baselineIds).not.toContain("creator-ferales");
    expect(delta.pathBEnrichedIds).not.toContain("creator-ferales");
  });
});
