import { describe, expect, it } from "vitest";
import {
  computeEvidenceBackedAffinityIds,
  mergeRankingPaths,
  rankQlooIndexedCandidates,
} from "./nativeRanking";
import type { CatalogueEntry, QlooEntity, Recommendation, TasteProfile } from "@/lib/types";
import type { QlooService } from "./client";

function stubEntry(
  id: string,
  extras: Partial<CatalogueEntry> = {},
): CatalogueEntry {
  return {
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
    kind: "venue",
    ...extras,
  };
}

function stubRec(
  id: string,
  path: "qloo_native" | "bragi_catalogue",
  extras: Partial<Recommendation> = {},
): Recommendation {
  const { entry: entryOverride, ...rest } = extras;
  return {
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
    ...rest,
    entry: stubEntry(id, entryOverride),
  };
}

describe("mergeRankingPaths", () => {
  it("keeps native and catalogue scores on separate scales", () => {
    const native = [stubRec("a", "qloo_native")];
    const catalogue = [
      stubRec("b", "bragi_catalogue", { score: 99 }),
      stubRec("a", "bragi_catalogue"),
    ];
    const merged = mergeRankingPaths(native, catalogue, 3);
    expect(merged.map((r) => r.entry.id)).toContain("a");
    expect(merged.map((r) => r.entry.id)).toContain("b");
    expect(merged.find((r) => r.entry.id === "a")?.rankingPath).toBe("qloo_native");
    expect(merged.find((r) => r.entry.id === "a")?.score).toBe(0);
    expect(merged.find((r) => r.entry.id === "b")?.score).toBe(99);
  });

  it("fills from catalogue when native is empty (safe fallback)", () => {
    const merged = mergeRankingPaths([], [stubRec("c", "bragi_catalogue")], 2);
    expect(merged).toHaveLength(1);
    expect(merged[0].rankingPath).toBe("bragi_catalogue");
  });

  it("does not let native places monopolize all slots when creators exist", () => {
    const native = [
      stubRec("place-a", "qloo_native"),
      stubRec("place-b", "qloo_native"),
      stubRec("place-c", "qloo_native"),
    ];
    const catalogue = [
      stubRec("creator-x", "bragi_catalogue", {
        score: 18,
        entry: stubEntry("creator-x", { kind: "creator" }),
      }),
    ];
    const merged = mergeRankingPaths(native, catalogue, { limit: 3, intent: "mixed" });
    expect(merged.some((r) => r.entry.id === "creator-x")).toBe(true);
    expect(merged.filter((r) => r.rankingPath === "qloo_native").length).toBeLessThanOrEqual(2);
  });

  it("surfaces creators first for creators intent", () => {
    const native = [stubRec("place-a", "qloo_native")];
    const catalogue = [
      stubRec("creator-x", "bragi_catalogue", {
        score: 18,
        entry: stubEntry("creator-x", { kind: "creator" }),
      }),
      stubRec("place-b", "bragi_catalogue", { score: 40 }),
    ];
    const merged = mergeRankingPaths(native, catalogue, { limit: 3, intent: "creators" });
    expect(merged[0].entry.id).toBe("creator-x");
    expect(merged[0].rankingPath).toBe("bragi_catalogue");
  });

  it("prefers places for places intent while keeping scale separation", () => {
    const native = [stubRec("place-a", "qloo_native", { qlooNativeAffinity: 0.7 })];
    const catalogue = [
      stubRec("creator-x", "bragi_catalogue", {
        score: 99,
        entry: stubEntry("creator-x", { kind: "creator" }),
      }),
      stubRec("place-b", "bragi_catalogue", { score: 12 }),
    ];
    const merged = mergeRankingPaths(native, catalogue, { limit: 3, intent: "places" });
    expect(merged[0].entry.id).toBe("place-a");
    expect(merged[0].qlooNativeAffinity).toBe(0.7);
    expect(merged.every((r) => r.entry.kind !== "creator" || r.entry.id === "creator-x")).toBe(
      true,
    );
    expect(merged.filter((r) => r.entry.kind !== "creator").length).toBeGreaterThanOrEqual(2);
  });
});

describe("computeEvidenceBackedAffinityIds", () => {
  const entry = stubEntry("teatro", {
    culturalHooks: ["radiohead", "experimental jazz", "alternative rock"],
    tags: ["theatre", "music"],
  });

  const profile: TasteProfile = {
    city: "Medellín",
    signals: [{ raw: "Radiohead", kind: "named_entity", inferredType: "urn:entity:artist" }],
    resolvedEntities: [{ id: "SIG-RH", name: "Radiohead", type: "urn:entity:artist" }],
    affinityEntities: [
      { id: "AFF-JAZZ", name: "experimental jazz", type: "urn:entity:artist" },
      { id: "AFF-UNRELATED", name: "Totally Unrelated Brand", type: "urn:entity:brand" },
    ],
    affinityTags: ["alternative rock", "urn:tag:genre:qloo:jazz"],
    evidence: [],
  };

  it("links explainability inputs and hook-overlapping affinities — not the venue id", () => {
    const ids = computeEvidenceBackedAffinityIds({
      entry,
      profile,
      candidateExplainability: {
        scope: "candidate",
        available: true,
        contributions: [{ key: "0", entityId: "SIG-RH", score: 0.8 }],
      },
    });
    expect(ids).toContain("SIG-RH");
    expect(ids).toContain("AFF-JAZZ");
    expect(ids).toContain("alternative rock");
    expect(ids).not.toContain("AFF-UNRELATED");
    expect(ids).not.toContain("teatro");
    expect(ids).not.toContain("VENUE-QLOO-ID");
  });

  it("does not invent pairwise connections when evidence is missing", () => {
    const ids = computeEvidenceBackedAffinityIds({
      entry: stubEntry("empty", { culturalHooks: ["pottery"], tags: [] }),
      profile,
      candidateExplainability: { scope: "candidate", available: false, contributions: [] },
    });
    expect(ids).toEqual([]);
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
      culturalHooks: ["radiohead"],
      provenance: "verified_public",
      actionHint: "Visit",
      kind: "venue",
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
      culturalHooks: ["radiohead"],
      provenance: "verified_public",
      actionHint: "Visit",
      kind: "venue",
      qlooEntityId: "ID-B",
      qlooEntityType: "urn:entity:place",
    },
  ];

  const profile: TasteProfile = {
    city: "Medellín",
    signals: [{ raw: "Radiohead", kind: "named_entity", inferredType: "urn:entity:artist" }],
    resolvedEntities: [{ id: "SIG", name: "Radiohead", type: "urn:entity:artist" }],
    affinityEntities: [{ id: "AFF-1", name: "Radiohead", type: "urn:entity:artist" }],
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
    expect(result.recommendations[0].matchedAffinityIds).toContain("SIG");
    expect(result.recommendations[0].matchedAffinityIds).not.toContain("ID-B");
    expect(result.aggregateExplainability?.scope).toBe("aggregate");
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
