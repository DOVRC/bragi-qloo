import { getCatalogue } from "@/data/catalogue";
import { humanizeTagId } from "@/lib/qloo/normalize";
import type {
  CatalogueEntry,
  Recommendation,
  TasteEvidence,
  TasteProfile,
} from "@/lib/types";

/** Minimum score to return a recommendation — prevents weak lexical coincidences. */
export const MIN_MATCH_SCORE = 6;

export interface CatalogueFilter {
  city?: string;
  budgetCop?: number;
  includeDemonstration?: boolean;
}

export class CatalogueService {
  constructor(private readonly entries: CatalogueEntry[] = getCatalogue()) {}

  list(filter: CatalogueFilter = {}): CatalogueEntry[] {
    const cityNorm = filter.city?.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "") ?? "";
    return this.entries.filter((entry) => {
      if (cityNorm) {
        const entryCity = entry.city.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
        if (cityNorm.includes("medell")) {
          if (!entryCity.includes("medell")) return false;
        } else if (!entryCity.includes(cityNorm) && !cityNorm.includes(entryCity)) {
          return false;
        }
      }
      if (
        filter.budgetCop != null &&
        entry.typicalCostCop != null &&
        entry.typicalCostCop > filter.budgetCop
      ) {
        return false;
      }
      if (filter.includeDemonstration === false && entry.provenance === "demonstration") {
        return false;
      }
      return true;
    });
  }

  match(
    profile: TasteProfile,
    limit = 3,
    options: { includeDemonstration?: boolean } = {},
  ): Recommendation[] {
    const candidates = this.list({
      city: profile.city,
      budgetCop: profile.budgetCop,
      includeDemonstration: options.includeDemonstration ?? true,
    });

    const scored = candidates
      .map((entry) => scoreEntry(entry, profile))
      .filter((r) => r.score >= MIN_MATCH_SCORE)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.entry.provenance !== b.entry.provenance) {
          return a.entry.provenance === "verified_public" ? -1 : 1;
        }
        return 0;
      })
      .slice(0, limit);

    return scored;
  }
}

function scoreEntry(entry: CatalogueEntry, profile: TasteProfile): Recommendation {
  const hooks = entry.culturalHooks.map((h) => h.toLowerCase());
  const tags = entry.tags.map((t) => t.toLowerCase());
  const haystack = [entry.name, entry.summary, ...hooks, ...tags].join(" ").toLowerCase();

  let score = 0;
  const evidence: TasteEvidence[] = [];
  const matchedTokens = new Set<string>();

  // 1) Direct resolved Qloo entities vs catalogue hooks (strong)
  for (const entity of profile.resolvedEntities) {
    const name = entity.name.toLowerCase();
    if (hooks.some((h) => h.includes(name) || name.includes(h) || tokenOverlap(h, name))) {
      score += 8;
      matchedTokens.add(name);
      evidence.push({
        source: "qloo_search",
        entityId: entity.id,
        entityName: entity.name,
        detail: `Resolved Qloo entity “${entity.name}” aligns with catalogue cultural hooks.`,
      });
    } else if (haystack.includes(name) && name.length > 4) {
      score += 3;
      matchedTokens.add(name);
    }
  }

  // 2) Insights affinity entities (moderate–strong when hook overlap)
  for (const affinity of profile.affinityEntities.slice(0, 15)) {
    const name = affinity.name.toLowerCase();
    if (hooks.some((h) => tokenOverlap(h, name) || h.includes(name) || name.includes(h))) {
      score += 5;
      evidence.push({
        source: "qloo_insights",
        entityId: affinity.id,
        entityName: affinity.name,
        detail: `Qloo Insights affinity “${affinity.name}” supports this catalogue match.`,
      });
    }
  }

  // 3) Qloo tags / humanized tag leaves (capped — live Insights can return thousands of amenity tags)
  let tagPoints = 0;
  const TAG_POINTS_CAP = 24;
  for (const tag of profile.affinityTags.slice(0, 40)) {
    if (tagPoints >= TAG_POINTS_CAP) break;
    const leaf = humanizeTagId(tag);
    const variants = [tag.toLowerCase(), leaf].filter((v) => v.length >= 4);
    for (const v of variants) {
      if (
        hooks.some((h) => h.includes(v) || v.includes(h) || tokenOverlap(h, v)) ||
        tags.some((t) => t.includes(v) || v.includes(t))
      ) {
        const add = v.length > 10 ? 4 : 3;
        tagPoints += add;
        score += add;
        matchedTokens.add(leaf);
        if (evidence.filter((e) => e.source === "qloo_insights" && !e.entityId).length < 4) {
          evidence.push({
            source: "qloo_insights",
            detail: `Qloo taste tag “${leaf}” overlaps catalogue metadata.`,
          });
        }
        break;
      }
    }
  }

  // 4) Raw user signals (weaker; still useful when Qloo sparse)
  for (const signal of profile.signals) {
    const raw = signal.raw.toLowerCase();
    if (hooks.some((h) => h.includes(raw) || raw.includes(h) || tokenOverlap(h, raw))) {
      score += 4;
      matchedTokens.add(raw);
      evidence.push({
        source: "user_signal",
        detail: `User signal “${signal.raw}” matches catalogue hooks (application-layer).`,
      });
    }
  }

  if (entry.provenance === "verified_public") score += 1.5;
  if (entry.provenance === "demonstration") score -= 0.5;

  // Require at least one Qloo-linked or strong signal evidence — not catalogue bonus alone
  const hasSubstantiveEvidence = evidence.some(
    (e) => e.source === "qloo_search" || e.source === "qloo_insights" || e.source === "user_signal",
  );
  if (!hasSubstantiveEvidence) {
    return {
      entry,
      score: 0,
      explanation: "",
      evidence: [],
      refinementSuggestions: [],
    };
  }

  evidence.push({
    source: "catalogue",
    detail:
      entry.provenance === "demonstration"
        ? "Catalogue provenance: demonstration profile (not a live booking)."
        : "Catalogue provenance: verified public venue/program.",
  });

  const explanation = buildExplanation(entry, evidence, profile, matchedTokens);
  const refinementSuggestions = [
    "Add another artist, film, or genre to reshape Qloo affinities.",
    "Adjust budget to include larger venues or focus on low-cost programs.",
    "Switch cultural lane (e.g. experimental vs urban/latin) to compare matches.",
  ];

  return { entry, score, explanation, evidence, refinementSuggestions };
}

function tokenOverlap(a: string, b: string): boolean {
  const aTokens = new Set(a.split(/[^a-z0-9]+/i).filter((t) => t.length > 2));
  const bTokens = b.split(/[^a-z0-9]+/i).filter((t) => t.length > 2);
  let hits = 0;
  for (const t of bTokens) if (aTokens.has(t)) hits += 1;
  return hits >= 1 && (hits >= 2 || [...aTokens].some((t) => t.length > 5 && b.includes(t)));
}

function buildExplanation(
  entry: CatalogueEntry,
  evidence: TasteEvidence[],
  profile: TasteProfile,
  matchedTokens: Set<string>,
): string {
  const qlooEntities = unique(
    evidence
      .filter((e) => e.source === "qloo_search" || e.source === "qloo_insights")
      .map((e) => e.entityName)
      .filter((n): n is string => Boolean(n)),
  );

  const signalNames = profile.signals.map((s) => s.raw).slice(0, 3).join(", ");
  const qlooPart =
    qlooEntities.length > 0
      ? ` Ranking used Qloo evidence including ${qlooEntities.slice(0, 4).join(", ")}.`
      : profile.affinityTags.length > 0
        ? ` Ranking used Qloo taste tags such as ${profile.affinityTags.slice(0, 4).map(humanizeTagId).join(", ")}.`
        : " Matching leaned on your stated signals plus any resolved Qloo entities.";

  const matchPart =
    matchedTokens.size > 0
      ? ` Overlap tokens: ${[...matchedTokens].slice(0, 5).join(", ")}.`
      : "";

  const demo =
    entry.provenance === "demonstration"
      ? " This entry is labeled demonstration data."
      : "";

  const disclaimer =
    " Explanations combine Qloo aggregate affinities with Bragi catalogue metadata — not proof of your personal behavior.";

  return `${entry.name} (${entry.neighborhood}) fits tastes around ${signalNames || "your cultural profile"}.${qlooPart}${matchPart}${demo}${disclaimer}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
