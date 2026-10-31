import { describe, expect, it } from "vitest";
import { CatalogueService } from "@/lib/catalogue/service";
import type { CatalogueEntry, TasteProfile } from "@/lib/types";

describe("Insights tag leaf dedupe", () => {
  it("scores the same humanized tag leaf at most once across URN variants", () => {
    const entry: CatalogueEntry = {
      id: "creator-alt",
      name: "Alt Creator",
      summary: "alt rock",
      category: "music",
      neighborhood: "Medellín",
      city: "Medellín",
      tags: ["alternative rock"],
      culturalHooks: ["alternative rock"],
      provenance: "verified_public",
      actionHint: "x",
      kind: "creator",
    };
    const hipHopPeer: CatalogueEntry = {
      id: "creator-hiphop",
      name: "Hip-Hop Creator",
      summary: "rap",
      category: "music",
      neighborhood: "Medellín",
      city: "Medellín",
      tags: ["hip-hop"],
      culturalHooks: ["hip hop", "rap"],
      provenance: "verified_public",
      actionHint: "x",
      kind: "creator",
    };

    const catalogue = new CatalogueService([entry, hipHopPeer]);
    const profile: TasteProfile = {
      city: "Medellín",
      signals: [
        { raw: "hip hop", kind: "genre_or_theme" },
        { raw: "rap", kind: "genre_or_theme" },
      ],
      resolvedEntities: [
        { id: "r1", name: "Hip Hop" },
        { id: "r2", name: "Rap" },
      ],
      affinityEntities: [],
      // Same leaf via many URN spellings — previously stacked 3+3+3+3
      affinityTags: [
        "alternative rock",
        "urn:tag:genre:music:alternative_rock",
        "urn:tag:genre:qloo:alternative_rock",
        "Alternative Rock",
        "urn:tag:genre:music:hip_hop",
        "urn:tag:genre:qloo:underground_hip_hop",
      ],
      evidence: [],
    };

    const ranked = catalogue.match(profile, 3, {
      includeDemonstration: false,
      kinds: ["creator", "project"],
    });

    const alt = ranked.find((r) => r.entry.id === "creator-alt");
    const hip = ranked.find((r) => r.entry.id === "creator-hiphop");

    expect(hip).toBeDefined();
    expect(hip!.qlooSearchPoints).toBeGreaterThan(0);
    // Alt creator may appear with at most one alternative-rock tag contribution
    if (alt) {
      const altTagContribs = alt.contributions.filter(
        (c) => c.kind === "qloo_insights_tag" && /alternative rock/i.test(c.label),
      );
      expect(altTagContribs.length).toBeLessThanOrEqual(1);
      expect(alt.qlooInsightsPoints).toBeLessThanOrEqual(3);
      expect(hip!.score).toBeGreaterThan(alt.score);
    } else {
      // Dropping below evidence floor is acceptable after dedupe
      expect(ranked[0].entry.id).toBe("creator-hiphop");
    }
  });
});
