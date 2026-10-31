import { describe, expect, it } from "vitest";
import type { CatalogueEntry, TasteProfile } from "@/lib/types";
import { CatalogueService } from "./service";

const rockCreator: CatalogueEntry = {
  id: "creator-rock-fixture",
  name: "Rock Fixture",
  summary: "alt rock",
  category: "music",
  neighborhood: "Medellín",
  city: "Medellín",
  tags: ["alternative rock", "post-punk"],
  culturalHooks: ["alternative rock", "post-punk", "art rock"],
  provenance: "verified_public",
  actionHint: "x",
  kind: "creator",
};

const hipHopCreator: CatalogueEntry = {
  id: "creator-hiphop-fixture",
  name: "Hip-Hop Fixture",
  summary: "rap",
  category: "music",
  neighborhood: "Medellín",
  city: "Medellín",
  tags: ["hip-hop", "rap"],
  culturalHooks: ["hip hop", "rap", "underground hip hop"],
  provenance: "verified_public",
  actionHint: "x",
  kind: "creator",
};

describe("weak Insights-tag-only genre bleed guard", () => {
  it("does not surface unsupported rock creators from hip-hop tag soup alone", () => {
    const catalogue = new CatalogueService([rockCreator, hipHopCreator]);
    const profile: TasteProfile = {
      city: "Medellín",
      signals: [
        { raw: "hip hop", kind: "genre_or_theme" },
        { raw: "rap", kind: "genre_or_theme" },
      ],
      resolvedEntities: [
        { id: "h1", name: "Hip Hop" },
        { id: "r1", name: "Rap" },
      ],
      affinityEntities: [],
      // Weak / off-lane tags that can overlap rock catalogue metadata
      affinityTags: [
        "funk",
        "alternative hip hop",
        "alternative rock",
        "art rock",
        "rock",
      ],
      evidence: [],
    };

    const ranked = catalogue.match(profile, 5, {
      includeDemonstration: false,
      kinds: ["creator", "project"],
    });

    expect(ranked.some((r) => r.entry.id === "creator-rock-fixture")).toBe(false);
    expect(ranked.some((r) => r.entry.id === "creator-hiphop-fixture")).toBe(true);
  });

  it("still surfaces rock creators when Search evidence supports them", () => {
    const catalogue = new CatalogueService([rockCreator, hipHopCreator]);
    const profile: TasteProfile = {
      city: "Medellín",
      signals: [
        { raw: "Radiohead", kind: "named_entity" },
        { raw: "alternative rock", kind: "genre_or_theme" },
      ],
      resolvedEntities: [
        { id: "rh", name: "Radiohead" },
        { id: "ar", name: "Alternative Rock" },
      ],
      affinityEntities: [],
      affinityTags: ["art rock", "alternative rock"],
      evidence: [],
    };

    const ranked = catalogue.match(profile, 3, {
      includeDemonstration: false,
      kinds: ["creator", "project"],
    });

    expect(ranked[0]?.entry.id).toBe("creator-rock-fixture");
  });

  it("still surfaces rock creators from live catalogue for Radiohead / alternative rock", () => {
    const service = new CatalogueService();
    const profile: TasteProfile = {
      city: "Medellín",
      signals: [
        { raw: "Radiohead", kind: "named_entity" },
        { raw: "alternative rock", kind: "genre_or_theme" },
      ],
      resolvedEntities: [
        { id: "rh", name: "Radiohead", type: "urn:entity:artist" },
        { id: "ar", name: "Alternative Rock" },
      ],
      affinityEntities: [{ id: "ty", name: "Thom Yorke", type: "urn:entity:artist" }],
      affinityTags: ["art rock", "alternative rock", "experimental rock"],
      evidence: [],
    };

    const ranked = service.match(profile, 5, {
      includeDemonstration: false,
      kinds: ["creator", "project"],
    });

    expect(ranked.some((r) => r.entry.id === "creator-ferales")).toBe(true);
  });

  it("still surfaces experimental-relevant creators from live catalogue", () => {
    const service = new CatalogueService();
    const profile: TasteProfile = {
      city: "Medellín",
      signals: [{ raw: "experimental music", kind: "genre_or_theme" }],
      resolvedEntities: [
        {
          id: "ex",
          name: "Electronic and Experimental Music: Technology, Music, and Culture",
        },
      ],
      affinityEntities: [],
      affinityTags: ["experimental rock", "electronic music", "experimental"],
      evidence: [],
    };

    const ranked = service.match(profile, 5, {
      includeDemonstration: false,
      kinds: ["creator", "project"],
    });

    expect(ranked.length).toBeGreaterThan(0);
    expect(
      ranked.some((r) =>
        /ferales|siempre|tape|intermedi|nomada/i.test(r.entry.id + r.entry.name),
      ),
    ).toBe(true);
  });
});
