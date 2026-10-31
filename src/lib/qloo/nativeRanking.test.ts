import { describe, expect, it } from "vitest";
import { mergeRankingPaths, rankQlooIndexedCandidates } from "./nativeRanking";
import type { CatalogueEntry, QlooEntity, Recommendation, TasteProfile } from "@/lib/types";
import type { QlooService } from "./client";

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
    const catalogue = [
      stubRec("b", "bragi_catalogue", { score: 99 }),
      stubRec("a", "bragi_catalogue"),
    ];
    const merged = mergeRankingPaths(native, catalogue, 3);
    expect(merged.map((r) => r.entry.id)).toEqual(["a", "b"]);
    expect(merged[0].rankingPath).toBe("qloo_native");
    expect(merged[0].score).toBe(0);
    expect(merged[1].score).toBe(99);
  });

  it("fills from catalogue when native is empty (safe fallback)", () => {
    const merged = mergeRankingPaths([], [stubRec("c", "bragi_catalogue")], 2);
    expect(merged).toHaveLength(1);
    expect(merged[0].rankingPath).toBe("bragi_catalogue");
  });
});

describe("rankQlooIndexedCandidates", () => {
  const entries: CatalogueEntry[] = [
    {
      id: "high-pop-low-aff",
      name: "High Pop Low Affinity",
      summary: "s",
      category: "performance",
      neighborhood: "Centro",
      city: "Medellín",
      tags: [],
      culturalHooks: [],
      provenance: "verified_public",
      actionHint: "Visit",
      qlooEntityId: "ID-A",
      qlooEntityType: "urn:entity:place",
    },
    {
      id: "low-pop-high-aff",
      name: "Low Pop High Affinity",
      summary: "s",
      category: "performance",
      neighborhood: "Centro",
      city: "Medellín",
      tags: [],
      culturalHooks: [],
      provenance: "verified_public",
      actionHint: "Visit",
      qlooEntityId: "ID-B",
      qlooEntityType: "urn:entity:place",
    },
  ];

  const profile: TasteProfile = {
    city: "Medellín",
    signals: [{ raw: "Radiohead", kind: "named_entity", inferredType: "urn:entity:artist" }],
    resolvedEntities: [{ id: "SIG", name: "Radiohead", type: "urn:entity:artist" }],
    affinityEntities: [],
    affinityTags: [],
    evidence: [],
  };

  it("orders by query.affinity even when popularity disagrees", async () => {
    const entities: QlooEntity[] = [
      {
        id: "ID-A",
        name: "High Pop Low Affinity",
        popularity: 0.99,
        affinity: 0.4,
        raw: {
          entity_id: "ID-A",
          name: "High Pop Low Affinity",
          popularity: 0.99,
          query: {
            affinity: 0.4,
            explainability: { "signal.interests.entities": { "0": 0.9 } },
          },
        },
      },
      {
        id: "ID-B",
        name: "Low Pop High Affinity",
        popularity: 0.5,
        affinity: 0.85,
        raw: {
          entity_id: "ID-B",
          name: "Low Pop High Affinity",
          popularity: 0.5,
          query: {
            affinity: 0.85,
            explainability: { "signal.interests.entities": { "0": 0.7 } },
          },
        },
      },
    ];

    const qloo = {
      getInsights: async () => ({
        entities,
        tags: [],
        raw: {
          query: {
            explainability: { "signal.interests.entities": { "0": 0.55 } },
          },
        },
      }),
    } as unknown as QlooService;

    const result = await rankQlooIndexedCandidates({ qloo, profile, entries, limit: 2 });
    expect(result.recommendations.map((r) => r.entry.id)).toEqual([
      "low-pop-high-aff",
      "high-pop-low-aff",
    ]);
    expect(result.recommendations[0].qlooNativeAffinity).toBeCloseTo(0.85);
    expect(result.recommendations[0].qlooExplainability?.scope).toBe("candidate");
    expect(result.recommendations[0].qlooExplainability?.available).toBe(true);
    // Aggregate must not be copied onto candidate contributions as if it were per-entity
    expect(result.aggregateExplainability?.scope).toBe("aggregate");
    expect(result.aggregateExplainability?.available).toBe(true);
  });

  it("retains candidates without advertising affinity when query.affinity is missing", async () => {
    const qloo = {
      getInsights: async () => ({
        entities: [
          {
            id: "ID-A",
            name: "High Pop Low Affinity",
            popularity: 0.99,
            raw: { entity_id: "ID-A", name: "High Pop Low Affinity", popularity: 0.99 },
          },
        ],
        tags: [],
        raw: {},
      }),
    } as unknown as QlooService;

    const result = await rankQlooIndexedCandidates({
      qloo,
      profile,
      entries: [entries[0]],
      limit: 1,
    });
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].qlooNativeAffinity).toBeUndefined();
    expect(result.recommendations[0].judgeExplanation).toMatch(/query\.affinity=n\/a/);
    expect(result.warnings.some((w) => /lacked query\.affinity/i.test(w))).toBe(true);
  });

  it("surfaces Insights timeout as warning and falls back to empty native set", async () => {
    const { QlooClientError } = await import("@/lib/types");
    const qloo = {
      getInsights: async () => {
        throw new QlooClientError("Qloo request timed out", "TIMEOUT");
      },
    } as unknown as QlooService;

    const result = await rankQlooIndexedCandidates({ qloo, profile, entries, limit: 2 });
    expect(result.recommendations).toEqual([]);
    expect(result.warnings.some((w) => /TIMEOUT|timed out/i.test(w))).toBe(true);
  });
});
