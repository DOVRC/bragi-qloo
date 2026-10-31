import { describe, expect, it } from "vitest";
import { CatalogueService } from "@/lib/catalogue/service";
import type { CatalogueEntry, TasteProfile } from "@/lib/types";

/**
 * Regression: Insights tag spam must not bury stronger Search-backed scores.
 * Does not hardcode a winner identity — asserts score/search ordering.
 */
describe("catalogue match ordering", () => {
  it("orders by total score before Insights points alone", () => {
    const strongSearch: CatalogueEntry = {
      id: "a-strong-search",
      name: "Strong Search Match",
      summary: "s",
      category: "music",
      neighborhood: "Medellín",
      city: "Medellín",
      tags: ["hip-hop"],
      culturalHooks: ["hip hop", "rap"],
      provenance: "verified_public",
      actionHint: "x",
      kind: "creator",
    };
    const insightsNoise: CatalogueEntry = {
      id: "b-insights-noise",
      name: "Insights Noise Match",
      summary: "s",
      category: "music",
      neighborhood: "Medellín",
      city: "Medellín",
      tags: ["electronic"],
      culturalHooks: ["electronic", "art rock"],
      provenance: "verified_public",
      actionHint: "x",
      kind: "creator",
    };

    const catalogue = new CatalogueService([insightsNoise, strongSearch]);
    const profile: TasteProfile = {
      city: "Medellín",
      signals: [
        { raw: "hip hop", kind: "genre_or_theme" },
        { raw: "rap", kind: "genre_or_theme" },
      ],
      resolvedEntities: [
        { id: "r1", name: "Hip Hop", type: "urn:entity:genre" },
        { id: "r2", name: "Rap", type: "urn:entity:genre" },
      ],
      affinityEntities: [],
      // Tags that only the noise entry overlaps — previously could dominate sort
      affinityTags: ["urn:tag:electronic", "urn:tag:art_rock", "urn:tag:rock"],
      evidence: [],
    };

    const ranked = catalogue.match(profile, 2, {
      includeDemonstration: false,
      kinds: ["creator", "project"],
    });

    expect(ranked.length).toBeGreaterThanOrEqual(1);
    expect(ranked[0].entry.id).toBe("a-strong-search");
    expect(ranked[0].qlooSearchPoints).toBeGreaterThan(ranked[0].qlooInsightsPoints);
    if (ranked[1]) {
      expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    }
  });
});
