import { describe, expect, it } from "vitest";
import { mergeRankingPaths } from "./nativeRanking";
import type { Recommendation } from "@/lib/types";

function stubRec(
  id: string,
  path: "qloo_native" | "bragi_catalogue",
  extras: Partial<Recommendation> = {},
): Recommendation {
  return {
    entry: {
      id,
      name: id,
      summary: "s",
      category: "music",
      neighborhood: "n",
      city: "Medellín",
      tags: [],
      culturalHooks: [],
      provenance: "verified_public",
      actionHint: "Open public profile.",
    },
    score: path === "bragi_catalogue" ? 20 : 0,
    explanation: "e",
    judgeExplanation: "j",
    evidence: [],
    evidenceStrength: path === "qloo_native" ? "qloo_backed_affinity" : "catalogue_supported",
    contributions: [],
    matchedAffinityIds: [],
    qlooInsightsPoints: 0,
    qlooSearchPoints: 0,
    userSignalPoints: 0,
    refinementSuggestions: [],
    rankingPath: path,
    qlooNativeAffinity: path === "qloo_native" ? 0.9 : undefined,
    ...extras,
  };
}

describe("mergeRankingPaths", () => {
  it("prefers native path without equating Bragi scores to Qloo affinities", () => {
    const native = [stubRec("a", "qloo_native")];
    const catalogue = [stubRec("b", "bragi_catalogue", { score: 99 }), stubRec("a", "bragi_catalogue")];
    const merged = mergeRankingPaths(native, catalogue, 3);
    expect(merged.map((r) => r.entry.id)).toEqual(["a", "b"]);
    expect(merged[0].rankingPath).toBe("qloo_native");
    expect(merged[0].score).toBe(0);
    expect(merged[1].score).toBe(99);
  });

  it("fills from catalogue when native is empty", () => {
    const merged = mergeRankingPaths([], [stubRec("c", "bragi_catalogue")], 2);
    expect(merged).toHaveLength(1);
    expect(merged[0].rankingPath).toBe("bragi_catalogue");
  });
});
