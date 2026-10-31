/**
 * Offline ablation: compare catalogue ranking modes on fixture profiles.
 * Does not call Qloo live — uses synthetic TasteProfiles.
 *
 * Usage: npx tsx scripts/qloo-ablation.ts
 */
import { CatalogueService } from "../src/lib/catalogue/service";
import type { TasteProfile } from "../src/lib/types";

const artHouse: TasteProfile = {
  city: "Medellín",
  budgetCop: 100_000,
  signals: [
    { raw: "Radiohead", kind: "named_entity", inferredType: "urn:entity:artist" },
    { raw: "Studio Ghibli", kind: "named_entity" },
    { raw: "experimental jazz", kind: "genre_or_theme" },
  ],
  resolvedEntities: [
    { id: "1", name: "Radiohead", type: "urn:entity:artist" },
    { id: "2", name: "Studio Ghibli" },
  ],
  affinityEntities: [
    { id: "3", name: "Portishead", type: "urn:entity:artist" },
    { id: "4", name: "Beck", type: "urn:entity:artist" },
  ],
  affinityTags: ["alternative rock", "cinematic", "ambient rock"],
  evidence: [],
};

const urban: TasteProfile = {
  city: "Medellín",
  budgetCop: 100_000,
  signals: [
    { raw: "reggaeton", kind: "genre_or_theme" },
    { raw: "urban fashion", kind: "genre_or_theme" },
    { raw: "latin dance", kind: "genre_or_theme" },
  ],
  resolvedEntities: [{ id: "10", name: "Bad Bunny", type: "urn:entity:artist" }],
  affinityEntities: [{ id: "11", name: "J Balvin", type: "urn:entity:artist" }],
  affinityTags: ["reggaeton", "streetwear", "dance"],
  evidence: [],
};

function summarize(label: string, profile: TasteProfile) {
  const service = new CatalogueService();
  const modes = ["user_only", "search_only", "insights_only", "full"] as const;
  console.log(`\n=== ${label} ===`);
  for (const mode of modes) {
    const recs = service.match(profile, 3, { mode });
    console.log(
      `${mode.padEnd(14)} → ${recs.map((r) => `${r.entry.id}(${r.evidenceStrength},path=${r.rankingPath},i=${r.qlooInsightsPoints},s=${r.qlooSearchPoints},u=${r.userSignalPoints},domain=${r.domainChangeEstablished})`).join(" | ") || "(none)"}`,
    );
  }
  const indexed = service
    .list({ city: profile.city, includeDemonstration: false })
    .filter((e) => e.qlooEntityId).length;
  const creators = service
    .list({ city: profile.city, includeDemonstration: false })
    .filter((e) => e.kind === "creator" || e.kind === "project").length;
  console.log(`catalogue coverage → qloo_indexed=${indexed} creators_or_projects=${creators}`);
}

summarize("Art-house fixture (Bragi Path B)", artHouse);
summarize("Urban fixture (Bragi Path B)", urban);

const fullA = new CatalogueService().match(artHouse, 3, { mode: "full" }).map((r) => r.entry.id);
const fullB = new CatalogueService().match(urban, 3, { mode: "full" }).map((r) => r.entry.id);
console.log("\nArt-house vs Urban place sets differ:", fullA.join("|") !== fullB.join("|"));
console.log(
  "Note: Path A (filter.results.entities + explainability) requires live Qloo — see docs/QLOO_NATIVE_VALIDATION.md",
);
