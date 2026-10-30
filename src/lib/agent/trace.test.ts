import { describe, expect, it } from "vitest";
import { buildDiscoveryTrace } from "./trace";
import type { Recommendation, TasteProfile } from "@/lib/types";

describe("buildDiscoveryTrace", () => {
  it("separates direct resolved entities from inferred Insights affinities", () => {
    const profile: TasteProfile = {
      city: "Medellín",
      signals: [{ raw: "Radiohead", kind: "named_entity" }],
      resolvedEntities: [{ id: "1", name: "Radiohead" }],
      affinityEntities: [
        { id: "1", name: "Radiohead" },
        { id: "2", name: "Portishead" },
      ],
      affinityTags: ["alternative rock", "radiohead"],
      evidence: [],
    };
    const recommendations = [
      {
        entry: { id: "venue-a" },
        qlooInsightsPoints: 6,
        qlooSearchPoints: 8,
      },
    ] as Recommendation[];

    const trace = buildDiscoveryTrace({
      mode: "live",
      profile,
      recommendations,
      steps: [],
      warnings: [],
    });

    expect(trace.resolvedEntities.map((n) => n.name)).toEqual(["Radiohead"]);
    expect(trace.discoveredAffinities.map((n) => n.name)).toEqual(["Portishead"]);
    expect(trace.themeTags).toContain("alternative rock");
    expect(trace.themeTags.map((t) => t.toLowerCase())).not.toContain("radiohead");
    expect(trace.evidenceCoverage.recommendationsWithInsights).toBe(1);
  });
});
