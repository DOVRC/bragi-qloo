import { getCatalogue } from "@/data/catalogue";
import {
  domainFromCatalogueCategory,
  domainFromQlooType,
  domainsFromSignals,
  hasTraceableDomainChange,
  type CulturalDomain,
} from "@/lib/domains";
import { humanizeTagId } from "@/lib/qloo/normalize";
import type {
  CatalogueEntry,
  CatalogueKind,
  EvidenceStrength,
  MatchContribution,
  Recommendation,
  TasteEvidence,
  TasteProfile,
} from "@/lib/types";

/** Minimum score to return a recommendation — prevents weak lexical coincidences. */
export const MIN_MATCH_SCORE = 6;

/** Cap raw user-string contribution so keyword-only matches stay weaker than Qloo-backed ones. */
/** Cap keeps keyword-only matches below typical Search(+8) or Insights(+6) contributions. */
export const USER_SIGNAL_POINTS_CAP = 5;
export const USER_SIGNAL_POINT = 2;

export interface CatalogueFilter {
  city?: string;
  budgetCop?: number;
  includeDemonstration?: boolean;
  /** When set, only include these catalogue kinds (venue / creator / project). */
  kinds?: CatalogueKind[];
}

export type MatchMode = "full" | "user_only" | "search_only" | "insights_only";

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
      if (filter.kinds?.length) {
        const kind = entry.kind ?? "venue";
        if (!filter.kinds.includes(kind)) return false;
      }
      return true;
    });
  }

  match(
    profile: TasteProfile,
    limit = 3,
    options: {
      includeDemonstration?: boolean;
      mode?: MatchMode;
      kinds?: CatalogueKind[];
    } = {},
  ): Recommendation[] {
    const candidates = this.list({
      city: profile.city,
      budgetCop: profile.budgetCop,
      includeDemonstration: options.includeDemonstration ?? true,
      kinds: options.kinds,
    });

    const scored = candidates
      .map((entry) => scoreEntry(entry, profile, options.mode ?? "full"))
      .filter((r) => r.score >= MIN_MATCH_SCORE)
      .sort((a, b) => {
        if (b.qlooInsightsPoints !== a.qlooInsightsPoints) {
          return b.qlooInsightsPoints - a.qlooInsightsPoints;
        }
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

function scoreEntry(
  entry: CatalogueEntry,
  profile: TasteProfile,
  mode: MatchMode,
): Recommendation {
  const hooks = entry.culturalHooks.map((h) => h.toLowerCase());
  const tags = entry.tags.map((t) => t.toLowerCase());
  const useSearch = mode === "full" || mode === "search_only";
  const useInsights = mode === "full" || mode === "insights_only";
  const useUser = mode === "full" || mode === "user_only";

  let score = 0;
  let qlooSearchPoints = 0;
  let qlooInsightsPoints = 0;
  let userSignalPoints = 0;
  const evidence: TasteEvidence[] = [];
  const contributions: MatchContribution[] = [];
  const matchedAffinityIds: string[] = [];
  const matchedTokens = new Set<string>();

  const resolvedNames = new Set(
    profile.resolvedEntities.map((e) => e.name.toLowerCase()),
  );
  const signalNames = new Set(profile.signals.map((s) => s.raw.toLowerCase()));

  if (useSearch) {
    for (const entity of profile.resolvedEntities) {
      const name = entity.name.toLowerCase();
      if (hooks.some((h) => h.includes(name) || name.includes(h) || tokenOverlap(h, name))) {
        const points = 8;
        score += points;
        qlooSearchPoints += points;
        matchedTokens.add(name);
        matchedAffinityIds.push(entity.id);
        contributions.push({
          kind: "qloo_search",
          label: entity.name,
          id: entity.id,
          points,
        });
        evidence.push({
          source: "qloo_search",
          entityId: entity.id,
          entityName: entity.name,
          detail: `Resolved Qloo Search entity “${entity.name}” aligns with catalogue cultural hooks.`,
        });
      }
    }
  }

  if (useInsights) {
    for (const affinity of profile.affinityEntities.slice(0, 15)) {
      const name = affinity.name.toLowerCase();
      // Skip affinities that merely restate a resolved/user signal — not new Insights value
      if (resolvedNames.has(name) || signalNames.has(name)) continue;
      if (hooks.some((h) => tokenOverlap(h, name) || h.includes(name) || name.includes(h))) {
        const points = 6;
        score += points;
        qlooInsightsPoints += points;
        matchedAffinityIds.push(affinity.id);
        contributions.push({
          kind: "qloo_insights_entity",
          label: affinity.name,
          id: affinity.id,
          points,
        });
        evidence.push({
          source: "qloo_insights",
          entityId: affinity.id,
          entityName: affinity.name,
          detail: `Qloo Insights affinity “${affinity.name}” supports this catalogue match.`,
        });
      }
    }

    let tagPoints = 0;
    const TAG_POINTS_CAP = 18;
    const fashionContext = profile.signals.some((s) =>
      /fashion|streetwear|brand|urban fashion/i.test(s.raw),
    );
    for (const tag of profile.affinityTags.slice(0, 40)) {
      if (tagPoints >= TAG_POINTS_CAP) break;
      const leaf = humanizeTagId(tag);
      const leafLower = leaf.toLowerCase();
      // Skip tags that are just the user's raw genre string restated
      if (signalNames.has(leafLower)) continue;
      // Decade-fashion / press noise often floods Insights payloads for music/film runs
      if (/\d{4}s\s+fashion/.test(leafLower) && !fashionContext) continue;
      if (/wall street journal|newspaper|magazine/.test(leafLower)) continue;
      if (/amenity|wheelchair|parking|wifi|hours|signage/.test(leafLower)) continue;
      const variants = [tag.toLowerCase(), leafLower].filter((v) => v.length >= 4);
      for (const v of variants) {
        if (
          hooks.some((h) => h.includes(v) || v.includes(h) || tokenOverlap(h, v)) ||
          tags.some((t) => t.includes(v) || v.includes(t))
        ) {
          const add = v.length > 10 ? 3 : 2;
          tagPoints += add;
          score += add;
          qlooInsightsPoints += add;
          matchedTokens.add(leaf);
          matchedAffinityIds.push(tag);
          if (contributions.filter((c) => c.kind === "qloo_insights_tag").length < 4) {
            contributions.push({
              kind: "qloo_insights_tag",
              label: leaf,
              id: tag,
              points: add,
            });
          }
          if (evidence.filter((e) => e.source === "qloo_insights" && !e.entityId).length < 4) {
            evidence.push({
              source: "qloo_insights",
              detail: `Qloo Insights taste tag “${leaf}” overlaps catalogue metadata.`,
            });
          }
          break;
        }
      }
    }
  }

  if (useUser) {
    let userBudget = 0;
    for (const signal of profile.signals) {
      if (userBudget >= USER_SIGNAL_POINTS_CAP) break;
      const raw = signal.raw.toLowerCase();
      // Avoid double-counting when the same string already scored via Search entity
      if (resolvedNames.has(raw) && qlooSearchPoints > 0) continue;
      if (hooks.some((h) => h.includes(raw) || raw.includes(h) || tokenOverlap(h, raw))) {
        const points = Math.min(USER_SIGNAL_POINT, USER_SIGNAL_POINTS_CAP - userBudget);
        userBudget += points;
        score += points;
        userSignalPoints += points;
        matchedTokens.add(raw);
        contributions.push({
          kind: "user_signal",
          label: signal.raw,
          points,
        });
        evidence.push({
          source: "user_signal",
          detail: `Your interest “${signal.raw}” overlaps catalogue hooks (application-layer, not a Qloo Insights result).`,
        });
      }
    }
  }

  if (entry.provenance === "verified_public") {
    score += 1.5;
    const label =
      entry.kind === "creator"
        ? "Verified creator"
        : entry.kind === "project"
          ? "Verified creative project"
          : "Verified venue";
    contributions.push({ kind: "catalogue", label, points: 1.5 });
  }
  if (entry.provenance === "demonstration") {
    score -= 0.5;
  }

  const hasSubstantiveEvidence = evidence.some(
    (e) =>
      e.source === "qloo_search" ||
      e.source === "qloo_insights" ||
      e.source === "user_signal",
  );
  if (!hasSubstantiveEvidence) {
    return emptyRecommendation(entry);
  }

  evidence.push({
    source: "catalogue",
    detail:
      entry.provenance === "demonstration"
        ? "Catalogue provenance: demonstration profile (not a live booking)."
        : entry.kind === "creator"
          ? "Catalogue provenance: verified public creator profile (not a ticketed event)."
          : entry.kind === "project"
            ? "Catalogue provenance: verified public creative project/space (check live programming separately)."
            : "Catalogue provenance: verified public venue/program (event availability is not confirmed here).",
  });

  const sourceDomains = domainsFromSignals(
    profile.signals,
    profile.resolvedEntities.map((e) => e.type),
  );
  // Domains of Insights entities that actually contributed
  const insightDomains: CulturalDomain[] = [];
  for (const c of contributions) {
    if (c.kind !== "qloo_insights_entity" || !c.id) continue;
    const ent = profile.affinityEntities.find((e) => e.id === c.id);
    insightDomains.push(domainFromQlooType(ent?.type));
  }
  const resultDomain = domainFromCatalogueCategory(entry.category);
  const domainChangeEstablished = hasTraceableDomainChange(
    [...sourceDomains, ...insightDomains],
    resultDomain,
  );

  const evidenceStrength = classifyStrength({
    qlooSearchPoints,
    qlooInsightsPoints,
    userSignalPoints,
    domainChangeEstablished,
  });

  const explanation = buildConsumerExplanation(entry, profile, contributions, evidenceStrength);
  const judgeExplanation = buildJudgeExplanation(
    entry,
    evidence,
    profile,
    matchedTokens,
    evidenceStrength,
    { qlooSearchPoints, qlooInsightsPoints, userSignalPoints },
    domainChangeEstablished,
  );

  return {
    entry,
    score,
    explanation,
    judgeExplanation,
    evidence,
    evidenceStrength,
    contributions,
    matchedAffinityIds: [...new Set(matchedAffinityIds)],
    qlooInsightsPoints,
    qlooSearchPoints,
    userSignalPoints,
    refinementSuggestions: [
      "Add another artist, film, or genre to reshape Qloo affinities.",
      "Adjust budget to include larger venues or focus on low-cost programs.",
      "Try the other example journey to compare discovered connections.",
    ],
    rankingPath: "bragi_catalogue",
    domainChangeEstablished,
  };
}

function emptyRecommendation(entry: CatalogueEntry): Recommendation {
  return {
    entry,
    score: 0,
    explanation: "",
    judgeExplanation: "",
    evidence: [],
    evidenceStrength: "limited_evidence",
    contributions: [],
    matchedAffinityIds: [],
    qlooInsightsPoints: 0,
    qlooSearchPoints: 0,
    userSignalPoints: 0,
    refinementSuggestions: [],
    rankingPath: "bragi_catalogue",
  };
}

/**
 * Strength labels — cross_domain requires a traceable domain change,
 * not merely a numeric Insights point threshold.
 */
export function classifyStrength(parts: {
  qlooSearchPoints: number;
  qlooInsightsPoints: number;
  userSignalPoints: number;
  domainChangeEstablished?: boolean;
  hasQlooNativeAffinity?: boolean;
}): EvidenceStrength {
  if (parts.hasQlooNativeAffinity && parts.domainChangeEstablished) {
    return "cross_domain_affinity";
  }
  if (parts.hasQlooNativeAffinity) return "qloo_backed_affinity";
  if (parts.qlooInsightsPoints >= 5 && parts.domainChangeEstablished) {
    return "cross_domain_affinity";
  }
  if (parts.qlooInsightsPoints >= 5) return "qloo_backed_affinity";
  if (parts.qlooSearchPoints >= 8) return "direct_taste_match";
  if (parts.qlooSearchPoints > 0 || parts.qlooInsightsPoints > 0) return "catalogue_supported";
  return "limited_evidence";
}

function buildConsumerExplanation(
  entry: CatalogueEntry,
  profile: TasteProfile,
  contributions: MatchContribution[],
  strength: EvidenceStrength,
): string {
  const interests = profile.signals
    .map((s) => s.raw)
    .slice(0, 3)
    .join(", ");
  const insights = contributions
    .filter((c) => c.kind === "qloo_insights_entity" || c.kind === "qloo_insights_tag")
    .map((c) => c.label)
    .slice(0, 3);
  const searchHits = contributions
    .filter((c) => c.kind === "qloo_search")
    .map((c) => c.label)
    .slice(0, 2);

  if (strength === "cross_domain_affinity" && insights.length > 0) {
    return `You selected ${interests}. Qloo returned related affinities such as ${insights.join(", ")}, which Bragi matched to ${entry.name} across cultural domains (Qloo evidence + Bragi catalogue).`;
  }
  if (strength === "qloo_backed_affinity" && insights.length > 0) {
    return `You selected ${interests}. Qloo Insights affinities such as ${insights.join(", ")} support this match. Bragi applied catalogue evidence — this is Qloo-backed affinity, not a claimed cross-domain leap.`;
  }
  if (strength === "direct_taste_match" && searchHits.length > 0) {
    return `You selected ${interests}. Qloo resolved ${searchHits.join(" and ")}, which align with this entry's cultural hooks in Bragi's Medellín catalogue.`;
  }
  if (strength === "catalogue_supported") {
    return `${entry.name} overlaps your interests (${interests}) with partial Qloo support. Treat this as a catalogue-assisted suggestion, not a personal prediction.`;
  }
  return `${entry.name} overlaps your stated interests (${interests}) in Bragi's catalogue. Qloo Insights did not strongly reinforce this match.`;
}

function buildJudgeExplanation(
  entry: CatalogueEntry,
  evidence: TasteEvidence[],
  profile: TasteProfile,
  matchedTokens: Set<string>,
  strength: EvidenceStrength,
  points: { qlooSearchPoints: number; qlooInsightsPoints: number; userSignalPoints: number },
  domainChangeEstablished: boolean,
): string {
  const qlooEntities = unique(
    evidence
      .filter((e) => e.source === "qloo_search" || e.source === "qloo_insights")
      .map((e) => e.entityName)
      .filter((n): n is string => Boolean(n)),
  );
  return [
    `path=bragi_catalogue`,
    `strength=${strength}`,
    `domainChange=${domainChangeEstablished}`,
    `points search=${points.qlooSearchPoints} insights=${points.qlooInsightsPoints} user=${points.userSignalPoints}`,
    `entities=${qlooEntities.slice(0, 5).join("|") || "none"}`,
    `tokens=${[...matchedTokens].slice(0, 6).join("|") || "none"}`,
    `signals=${profile.signals.map((s) => s.raw).join("|")}`,
    entry.provenance === "demonstration" ? "DEMO_PROFILE" : "VERIFIED",
  ].join("; ");
}

function tokenOverlap(a: string, b: string): boolean {
  const aTokens = new Set(a.split(/[^a-z0-9]+/i).filter((t) => t.length > 2));
  const bTokens = b.split(/[^a-z0-9]+/i).filter((t) => t.length > 2);
  let hits = 0;
  for (const t of bTokens) if (aTokens.has(t)) hits += 1;
  return hits >= 1 && (hits >= 2 || [...aTokens].some((t) => t.length > 5 && b.includes(t)));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
