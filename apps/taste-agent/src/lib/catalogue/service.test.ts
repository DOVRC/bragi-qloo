import { describe, expect, it } from "vitest";
import type { TasteProfile } from "@/lib/types";
import { CatalogueService, MIN_MATCH_SCORE } from "./service";

function profile(overrides: Partial<TasteProfile> = {}): TasteProfile {
  return {
    city: "Medellín",
    budgetCop: 100_000,
    signals: [
      { raw: "Radiohead", kind: "named_entity", inferredType: "urn:entity:artist" },
      { raw: "Studio Ghibli", kind: "named_entity" },
      { raw: "experimental jazz", kind: "genre_or_theme", inferredType: "urn:entity:artist" },
    ],
    resolvedEntities: [
      { id: "1", name: "Radiohead", type: "urn:entity:artist" },
      { id: "2", name: "Studio Ghibli" },
    ],
    affinityEntities: [
      { id: "3", name: "Portishead", type: "urn:entity:artist" },
      { id: "4", name: "Arcade Fire", type: "urn:entity:artist" },
    ],
    affinityTags: ["experimental jazz", "alternative rock", "cinematic"],
    evidence: [],
    ...overrides,
  };
}

function urbanProfile(): TasteProfile {
  return {
    city: "Medellín",
    budgetCop: 100_000,
    signals: [
      { raw: "reggaeton", kind: "genre_or_theme", inferredType: "urn:entity:artist" },
      { raw: "urban fashion", kind: "genre_or_theme", inferredType: "urn:entity:brand" },
      { raw: "latin dance", kind: "genre_or_theme" },
    ],
    resolvedEntities: [{ id: "10", name: "Bad Bunny", type: "urn:entity:artist" }],
    affinityEntities: [{ id: "11", name: "J Balvin", type: "urn:entity:artist" }],
    affinityTags: ["reggaeton", "urban", "dance", "streetwear"],
    evidence: [],
  };
}

describe("CatalogueService.match", () => {
  it("returns up to three scored recommendations within budget", () => {
    const service = new CatalogueService();
    const recs = service.match(profile(), 3);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(3);
    expect(recs.every((r) => r.score >= MIN_MATCH_SCORE)).toBe(true);
    expect(
      recs.every(
        (r) => r.entry.typicalCostCop == null || r.entry.typicalCostCop <= 100_000,
      ),
    ).toBe(true);
    expect(recs[0].explanation.length).toBeGreaterThan(20);
  });

  it("differentiates experimental vs urban profiles", () => {
    const service = new CatalogueService();
    const a = service.match(profile(), 3).map((r) => r.entry.id);
    const b = service.match(urbanProfile(), 3).map((r) => r.entry.id);
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
    // Top recommendations should not be identical sets
    expect(a.join("|")).not.toEqual(b.join("|"));
  });

  it("returns empty when evidence cannot justify a match", () => {
    const service = new CatalogueService();
    const recs = service.match(
      profile({
        signals: [{ raw: "obscure xyz123", kind: "named_entity" }],
        resolvedEntities: [],
        affinityEntities: [],
        affinityTags: [],
      }),
      3,
    );
    expect(recs).toEqual([]);
  });

  it("filters out expensive entries when budget is low", () => {
    const service = new CatalogueService();
    const recs = service.match(profile({ budgetCop: 15_000 }), 5);
    expect(
      recs.every(
        (r) => r.entry.typicalCostCop == null || r.entry.typicalCostCop <= 15_000,
      ),
    ).toBe(true);
  });
});
