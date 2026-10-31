import { describe, expect, it } from "vitest";
import { CatalogueService } from "@/lib/catalogue/service";
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

function rec(entry: CatalogueEntry, over: Partial<Recommendation> = {}): Recommendation {
  return {
    entry,
    score: 12,
    explanation: "e",
    judgeExplanation: "j",
    evidence: [{ source: "qloo_insights", detail: "aff" }],
    evidenceStrength: "qloo_backed_affinity",
    contributions: [
      { kind: "qloo_insights_entity", label: "alternative rock", points: 6 },
    ],
    matchedAffinityIds: ["a1"],
    qlooInsightsPoints: 6,
    qlooSearchPoints: 0,
    userSignalPoints: 0,
    refinementSuggestions: [],
    rankingPath: "bragi_catalogue",
    ...over,
  };
}

describe("computeQlooDelta", () => {
  it("reports newly surfaced matches vs user-only baseline without inventing diffs", () => {
    const catalogue = new CatalogueService([ferales, alcoli]);
    const result: DiscoverSuccess = {
      ok: true,
      mode: "live",
      profile: {
        city: "Medellín",
        signals: [{ raw: "hip hop", kind: "genre_or_theme" }],
        resolvedEntities: [],
        affinityEntities: [{ id: "a1", name: "alternative rock" }],
        affinityTags: [],
        evidence: [],
      },
      recommendations: [rec(ferales)],
      steps: [],
      warnings: [],
      trace: {
        requestId: "t",
        mode: "live",
        userSignals: ["hip hop"],
        resolvedEntities: [],
        discoveredAffinities: [],
        themeTags: [],
        matchedCatalogueIds: ["creator-ferales"],
        selectedRecommendationIds: ["creator-ferales"],
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

    const delta = computeQlooDelta(result, catalogue);
    expect(delta.newAffinityNames).toContain("alternative rock");
    // User-only baseline for "hip hop" should prefer Alcolirykoz, not Ferales
    expect(delta.baselineNames).toContain("Alcolirykoz");
    expect(delta.newlySurfacedNames).toContain("Ferales");
    expect(delta.note.length).toBeGreaterThan(20);
  });

  it("truthfully notes overlap when paths agree", () => {
    const catalogue = new CatalogueService([alcoli]);
    const result: DiscoverSuccess = {
      ok: true,
      mode: "live",
      profile: {
        city: "Medellín",
        signals: [{ raw: "hip hop", kind: "genre_or_theme" }],
        resolvedEntities: [],
        affinityEntities: [],
        affinityTags: [],
        evidence: [],
      },
      recommendations: [
        rec(alcoli, {
          qlooInsightsPoints: 0,
          contributions: [{ kind: "user_signal", label: "hip hop", points: 2 }],
          evidence: [{ source: "user_signal", detail: "overlap" }],
        }),
      ],
      steps: [],
      warnings: [],
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
          insightEntities: 0,
          insightTags: 0,
          recommendationsWithInsights: 0,
          recommendationsDirectOnly: 1,
        },
        steps: [],
        warnings: [],
      },
    };

    const delta = computeQlooDelta(result, catalogue);
    expect(delta.sharedNames).toContain("Alcolirykoz");
    expect(delta.newlySurfacedNames).toHaveLength(0);
  });
});
