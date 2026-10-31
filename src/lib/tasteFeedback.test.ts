import { describe, expect, it } from "vitest";
import { moreLikeSignals, pickNextSurpriseAffinity } from "./tasteFeedback";
import type { Recommendation } from "@/lib/types";

function stubRec(): Recommendation {
  return {
    entry: {
      id: "teatro-pablo-tobon",
      name: "Teatro Pablo Tobón Uribe",
      summary: "s",
      category: "performance",
      neighborhood: "Centro",
      city: "Medellín",
      tags: [],
      culturalHooks: ["radiohead", "alternative rock", "experimental jazz"],
      provenance: "verified_public",
      actionHint: "Visit",
      kind: "venue",
    },
    score: 0,
    explanation: "e",
    judgeExplanation: "j",
    evidence: [],
    evidenceStrength: "qloo_backed_affinity",
    contributions: [
      { kind: "qloo_explainability", label: "Thom Yorke", points: 0, qlooScore: 0.3 },
      { kind: "qloo_insights_entity", label: "Beck", id: "beck", points: 6 },
      { kind: "qloo_insights_tag", label: "alternative rock", points: 2 },
    ],
    matchedAffinityIds: [],
    qlooInsightsPoints: 8,
    qlooSearchPoints: 0,
    userSignalPoints: 0,
    refinementSuggestions: [],
    rankingPath: "qloo_native",
    qlooNativeAffinity: 0.74,
  };
}

describe("moreLikeSignals", () => {
  it("places boost evidence before existing interests so the resolve budget can reach them", () => {
    const current = [
      "Radiohead",
      "Studio Ghibli",
      "experimental jazz",
      "Miles Davis",
      "Arcade Fire",
    ];
    const { signals, priority } = moreLikeSignals(stubRec(), current);
    expect(priority[0]).toBe("Thom Yorke");
    expect(signals[0]).toBe("Thom Yorke");
    expect(signals).toContain("Beck");
    expect(signals.indexOf("Thom Yorke")).toBeLessThan(signals.indexOf("Arcade Fire"));
  });
});

describe("pickNextSurpriseAffinity", () => {
  const affinities = [
    { name: "Thom Yorke" },
    { name: "Beck" },
    { name: "Gorillaz" },
  ];

  it("avoids repeating the first affinity when unused options remain", () => {
    expect(pickNextSurpriseAffinity(affinities, [], 0)?.name).toBe("Thom Yorke");
    expect(pickNextSurpriseAffinity(affinities, ["Thom Yorke"], 1)?.name).toBe("Beck");
    expect(pickNextSurpriseAffinity(affinities, ["Thom Yorke", "Beck"], 2)?.name).toBe(
      "Gorillaz",
    );
  });

  it("recycles the pool only after all affinities were used", () => {
    const again = pickNextSurpriseAffinity(
      affinities,
      ["Thom Yorke", "Beck", "Gorillaz"],
      3,
    );
    expect(again?.name).toBeTruthy();
    expect(affinities.map((a) => a.name)).toContain(again!.name);
  });
});
