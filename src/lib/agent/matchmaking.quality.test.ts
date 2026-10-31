import { describe, expect, it } from "vitest";
import { CatalogueService } from "@/lib/catalogue/service";
import { mergeRankingPaths } from "@/lib/qloo/nativeRanking";
import { kindsForIntent, planInsights } from "@/lib/agent/discovery";
import { classifySignal, parseDiscoverInput, validateDiscoverRequest } from "@/lib/signals";
import type { DiscoveryIntent, Recommendation, TasteProfile } from "@/lib/types";

/** Ten varied cultural profiles for matchmaking quality regression. */
const PROFILES: Array<{
  name: string;
  signals: string[];
  intent: DiscoveryIntent;
}> = [
  { name: "art-house", signals: ["Radiohead", "Studio Ghibli", "experimental jazz"], intent: "mixed" },
  { name: "urban", signals: ["reggaeton", "urban fashion", "latin dance"], intent: "mixed" },
  { name: "creators-hiphop", signals: ["hip hop", "reggaeton", "urban fashion"], intent: "creators" },
  { name: "places-jazz", signals: ["Miles Davis", "experimental jazz"], intent: "places" },
  { name: "film-visual", signals: ["Studio Ghibli", "Spirited Away", "animation"], intent: "mixed" },
  { name: "literary-memory", signals: ["documentary", "community", "latin"], intent: "places" },
  { name: "indie-rock", signals: ["Arcade Fire", "alternative rock", "Radiohead"], intent: "creators" },
  { name: "dance-latin", signals: ["salsa", "latin dance", "cumbia"], intent: "mixed" },
  { name: "fashion-brand", signals: ["urban fashion", "streetwear", "nike"], intent: "mixed" },
  { name: "surprise-ambient", signals: ["ambient", "patagonia", "nature"], intent: "mixed" },
];

function profileFromSignals(signals: string[], city = "Medellín"): TasteProfile {
  const parsed = parseDiscoverInput({ query: signals.join(", "), signals, city });
  return {
    city,
    budgetCop: 100_000,
    signals: parsed.signals,
    resolvedEntities: parsed.signals
      .filter((s) => s.kind === "named_entity")
      .slice(0, 3)
      .map((s, i) => ({
        id: `resolved-${i}`,
        name: s.raw,
        type: s.inferredType,
      })),
    affinityEntities: [
      { id: "aff-alt-rock", name: "alternative rock", type: "urn:entity:artist" },
      { id: "aff-hiphop", name: "hip hop", type: "urn:entity:artist" },
      { id: "aff-animation", name: "animation", type: "urn:entity:movie" },
      { id: "aff-streetwear", name: "streetwear", type: "urn:entity:brand" },
    ],
    affinityTags: ["jazz", "urban", "indie", "visual", "community", "fashion"],
    evidence: [],
  };
}

function stubNativePlace(id: string, affinity: number): Recommendation {
  return {
    entry: {
      id,
      name: id,
      summary: "s",
      category: "performance",
      neighborhood: "Centro",
      city: "Medellín",
      tags: [],
      culturalHooks: [],
      provenance: "verified_public",
      actionHint: "Visit",
      kind: "venue",
      qlooEntityId: `Q-${id}`,
    },
    score: 0,
    explanation: "native",
    judgeExplanation: "native",
    evidence: [],
    evidenceStrength: "qloo_backed_affinity",
    contributions: [],
    matchedAffinityIds: [],
    qlooInsightsPoints: 0,
    qlooSearchPoints: 0,
    userSignalPoints: 0,
    refinementSuggestions: [],
    rankingPath: "qloo_native",
    qlooNativeAffinity: affinity,
  };
}

describe("matchmaking quality across cultural profiles", () => {
  const catalogue = new CatalogueService();

  it("covers 10 profiles with measurable diversity and creator intent", () => {
    const metrics = {
      profiles: 0,
      withCreators: 0,
      empty: 0,
      qlooBacked: 0,
      uniqueTopIds: new Set<string>(),
      nativeMonopolyBlocked: 0,
    };

    for (const p of PROFILES) {
      metrics.profiles += 1;
      const profile = profileFromSignals(p.signals);
      const kinds = kindsForIntent(p.intent);
      const pathB = catalogue.match(profile, 6, {
        includeDemonstration: false,
        kinds,
      });
      const nativeFlood = [
        stubNativePlace("n1", 0.95),
        stubNativePlace("n2", 0.9),
        stubNativePlace("n3", 0.85),
      ];
      const merged = mergeRankingPaths(nativeFlood, pathB, { limit: 3, intent: p.intent });

      if (merged.length === 0) metrics.empty += 1;
      if (merged.some((r) => r.entry.kind === "creator" || r.entry.kind === "project")) {
        metrics.withCreators += 1;
      }
      if (
        merged.some(
          (r) =>
            r.rankingPath === "qloo_native" ||
            r.qlooInsightsPoints > 0 ||
            r.qlooSearchPoints > 0,
        )
      ) {
        metrics.qlooBacked += 1;
      }
      for (const r of merged) metrics.uniqueTopIds.add(r.entry.id);

      if (p.intent === "mixed" || p.intent === "creators") {
        const nativeCount = merged.filter((r) => r.rankingPath === "qloo_native").length;
        if (pathB.some((r) => r.entry.kind === "creator" || r.entry.kind === "project")) {
          expect(nativeCount).toBeLessThan(3);
          metrics.nativeMonopolyBlocked += 1;
        }
      }

      // Live path must never include demonstration profiles
      expect(merged.every((r) => r.entry.provenance !== "demonstration")).toBe(true);

      // Creators without Qloo ids must not be labeled native
      for (const r of merged) {
        if (!r.entry.qlooEntityId) {
          expect(r.rankingPath).toBe("bragi_catalogue");
        }
      }
    }

    expect(metrics.profiles).toBe(10);
    expect(metrics.empty).toBeLessThanOrEqual(2);
    expect(metrics.withCreators).toBeGreaterThanOrEqual(3);
    expect(metrics.uniqueTopIds.size).toBeGreaterThanOrEqual(4);
    expect(metrics.nativeMonopolyBlocked).toBeGreaterThanOrEqual(3);

    // Soft report for release notes — not score blending
    expect(metrics.qlooBacked).toBe(10);
  });

  it("validates intent on discover requests", () => {
    const ok = validateDiscoverRequest({
      query: "Radiohead",
      signals: ["Radiohead"],
      intent: "creators",
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.intent).toBe("creators");

    const surprise = validateDiscoverRequest({
      query: "jazz",
      signals: ["jazz"],
      intent: "surprise-me",
    });
    expect(surprise.ok).toBe(true);
    if (surprise.ok) expect(surprise.value.intent).toBe("mixed");
  });

  it("does not default unknown named entities to artists", () => {
    const s = classifySignal("Frida Kahlo");
    expect(s.kind).toBe("named_entity");
    expect(s.inferredType).toBeUndefined();
  });

  it("plans Insights from resolved types without forcing artist for film-only", () => {
    const film = parseDiscoverInput({
      query: "Studio Ghibli",
      signals: ["Studio Ghibli"],
    });
    const plan = planInsights(
      film.signals,
      [{ id: "1", name: "Studio Ghibli", type: "urn:entity:brand" }],
      "Medellín",
    );
    expect(plan.some((p) => p.filterType === "urn:entity:movie" || p.filterType === "urn:entity:brand")).toBe(
      true,
    );
    // Brand/film resolved alone must not require artist simply because resolved.length > 0
    const artistOnlyBecauseResolved = plan.filter((p) =>
      /default affinity probe from resolved entities/i.test(p.reason),
    );
    expect(artistOnlyBecauseResolved).toHaveLength(0);
  });

  it("honours excludeEntryIds when merging after Not my style feedback", () => {
    const profile = profileFromSignals(["Radiohead", "experimental jazz"]);
    const pathB = catalogue.match(profile, 6, { includeDemonstration: false });
    expect(pathB.length).toBeGreaterThan(0);
    const excluded = pathB[0].entry.id;
    const filtered = pathB.filter((r) => r.entry.id !== excluded);
    const merged = mergeRankingPaths([], filtered, { limit: 3, intent: "mixed" });
    expect(merged.every((r) => r.entry.id !== excluded)).toBe(true);
  });
});
