import { describe, expect, it } from "vitest";
import { CatalogueService, classifyStrength } from "./service";
import type { CatalogueEntry, TasteProfile } from "@/lib/types";

describe("classifyStrength", () => {
  it("does not label same-domain Insights volume as cross-domain", () => {
    expect(
      classifyStrength({
        qlooSearchPoints: 0,
        qlooInsightsPoints: 12,
        userSignalPoints: 0,
        domainChangeEstablished: false,
      }),
    ).toBe("qloo_backed_affinity");
  });

  it("requires domain change for cross_domain_affinity", () => {
    expect(
      classifyStrength({
        qlooSearchPoints: 0,
        qlooInsightsPoints: 12,
        userSignalPoints: 0,
        domainChangeEstablished: true,
      }),
    ).toBe("cross_domain_affinity");
  });

  it("labels native affinity without domain change as qloo_backed", () => {
    expect(
      classifyStrength({
        qlooSearchPoints: 0,
        qlooInsightsPoints: 0,
        userSignalPoints: 0,
        hasQlooNativeAffinity: true,
        domainChangeEstablished: false,
      }),
    ).toBe("qloo_backed_affinity");
  });
});

describe("catalogue matching edge cases", () => {
  const localOnly: CatalogueEntry = {
    id: "local-creator",
    name: "Local Creator Without Qloo",
    summary: "Independent creator not indexed in Qloo.",
    category: "music",
    neighborhood: "Laureles",
    city: "Medellín",
    tags: ["independent", "jazz"],
    culturalHooks: ["experimental jazz", "jazz", "improvisation"],
    provenance: "verified_public",
    kind: "creator",
    publicUrl: "https://example.com/creator",
    actionHint: "Visit the public profile.",
  };

  it("matches a local creator absent from Qloo via catalogue path only", () => {
    const service = new CatalogueService([localOnly]);
    const profile: TasteProfile = {
      city: "Medellín",
      signals: [{ raw: "experimental jazz", kind: "genre_or_theme" }],
      resolvedEntities: [],
      affinityEntities: [
        { id: "a1", name: "Contemporary Jazz Collective", type: "urn:entity:artist" },
      ],
      affinityTags: ["urn:tag:genre:qloo:jazz"],
      evidence: [],
    };
    const recs = service.match(profile, 3);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].rankingPath).toBe("bragi_catalogue");
    expect(recs[0].entry.qlooEntityId).toBeUndefined();
  });

  it("returns empty when no candidate matches", () => {
    const service = new CatalogueService([localOnly]);
    const recs = service.match(
      {
        city: "Medellín",
        signals: [{ raw: "zzzz-no-match", kind: "named_entity" }],
        resolvedEntities: [],
        affinityEntities: [],
        affinityTags: [],
        evidence: [],
      },
      3,
    );
    expect(recs).toEqual([]);
  });

  it("does not overfit solely on a single preset hook without Qloo or user evidence", () => {
    const overfitted: CatalogueEntry = {
      ...localOnly,
      id: "overfit",
      actionHint: "Demo only.",
      culturalHooks: ["radiohead", "studio ghibli", "experimental jazz"],
    };
    const service = new CatalogueService([overfitted]);
    const recs = service.match(
      {
        city: "Medellín",
        signals: [],
        resolvedEntities: [],
        affinityEntities: [],
        affinityTags: [],
        evidence: [],
      },
      3,
    );
    expect(recs).toEqual([]);
  });
});
