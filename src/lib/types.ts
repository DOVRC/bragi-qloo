/** Shared domain types for Bragi Taste Agent */

export type QlooEntityType =
  | "urn:entity:artist"
  | "urn:entity:book"
  | "urn:entity:brand"
  | "urn:entity:destination"
  | "urn:entity:movie"
  | "urn:entity:person"
  | "urn:entity:place"
  | "urn:entity:podcast"
  | "urn:entity:tv_show"
  | "urn:entity:video_game"
  | "urn:entity:videogame"
  | "urn:entity:locality"
  | string;

export type CulturalSignalKind = "named_entity" | "genre_or_theme";

export interface CulturalSignal {
  raw: string;
  kind: CulturalSignalKind;
  inferredType?: QlooEntityType;
}

export interface DiscoverRequest {
  query: string;
  signals?: string[];
  city?: string;
  budgetCop?: number;
  categories?: CatalogueCategory[];
}

export interface QlooEntity {
  id: string;
  name: string;
  type?: string;
  popularity?: number;
  properties?: Record<string, unknown>;
  raw?: unknown;
}

export type EvidenceSource =
  | "qloo_search"
  | "qloo_tags"
  | "qloo_insights"
  | "user_signal"
  | "catalogue";

export interface TasteEvidence {
  source: EvidenceSource;
  entityId?: string;
  entityName?: string;
  detail: string;
}

export interface TasteProfile {
  city: string;
  budgetCop?: number;
  signals: CulturalSignal[];
  resolvedEntities: QlooEntity[];
  affinityEntities: QlooEntity[];
  affinityTags: string[];
  evidence: TasteEvidence[];
}

export type CatalogueCategory =
  | "music"
  | "visual_arts"
  | "performance"
  | "literary"
  | "craft"
  | "experience"
  | "film";

export type CatalogueProvenance = "verified_public" | "demonstration";

/** Venue/program vs independent creator profile in the lightweight catalogue. */
export type CatalogueKind = "venue" | "creator" | "project";

export interface CatalogueEntry {
  id: string;
  name: string;
  summary: string;
  category: CatalogueCategory;
  neighborhood: string;
  city: string;
  /** Approximate typical cost in COP; omit if unknown — never invent booking prices */
  typicalCostCop?: number;
  tags: string[];
  /** Free-text cultural affinities used for matching (genres, vibes, related artists) */
  culturalHooks: string[];
  provenance: CatalogueProvenance;
  publicUrl?: string;
  actionHint: string;
  /** Venue vs independent creator / creative project */
  kind?: CatalogueKind;
  /** Discipline label for creators (e.g. hip-hop, visual arts) */
  discipline?: string;
  /** Public attribution for how the profile was verified */
  sourceAttribution?: string;
  /**
   * Verified Qloo entity id from Search (name + location checked).
   * Absent when the entry is not confidently indexed in Qloo.
   */
  qlooEntityId?: string;
  qlooEntityType?: QlooEntityType;
  qlooEntityName?: string;
}

/** How strongly Qloo-derived evidence supports a catalogue match. */
export type EvidenceStrength =
  | "cross_domain_affinity"
  | "qloo_backed_affinity"
  | "direct_taste_match"
  | "catalogue_supported"
  | "limited_evidence";

export type ContributionKind =
  | "qloo_search"
  | "qloo_insights_entity"
  | "qloo_insights_tag"
  | "qloo_native_affinity"
  | "qloo_explainability"
  | "user_signal"
  | "catalogue";

export interface MatchContribution {
  kind: ContributionKind;
  label: string;
  id?: string;
  points: number;
  /** Optional native Qloo influence in [0,1] — not comparable to Bragi points */
  qlooScore?: number;
}

/** Ranking provenance — never treat Path B scores as Path A affinities. */
export type RankingPath = "qloo_native" | "bragi_catalogue";

export interface QlooExplainabilitySummary {
  available: boolean;
  warning?: string;
  contributions: Array<{
    key: string;
    entityId?: string;
    entityName?: string;
    score?: number;
  }>;
}

export interface Recommendation {
  entry: CatalogueEntry;
  score: number;
  /** Concise consumer-facing explanation */
  explanation: string;
  /** Technical explanation for judges / advanced disclosure */
  judgeExplanation: string;
  evidence: TasteEvidence[];
  evidenceStrength: EvidenceStrength;
  contributions: MatchContribution[];
  /** Affinity entity/tag ids that contributed — used for UI highlighting */
  matchedAffinityIds: string[];
  /** Points from Insights entities + tags only */
  qlooInsightsPoints: number;
  /** Points from Search-resolved entities */
  qlooSearchPoints: number;
  /** Points from raw user strings (application-layer) */
  userSignalPoints: number;
  refinementSuggestions: string[];
  /** Which ranking path produced this recommendation */
  rankingPath: RankingPath;
  /**
   * Qloo Insights affinity for filter.results.entities (0–1 scale).
   * Only set for rankingPath=qloo_native — not comparable to `score`.
   */
  qlooNativeAffinity?: number;
  /** Sanitized Qloo explainability for the Why step */
  qlooExplainability?: QlooExplainabilitySummary;
  /** Whether a true domain change was established for cross-domain labeling */
  domainChangeEstablished?: boolean;
}

export type AffinityKind = "direct" | "inferred";

export interface AffinityNode {
  id: string;
  name: string;
  source: "qloo_search" | "qloo_tags" | "qloo_insights";
  categoryHint?: string;
  originatingSignals?: string[];
  kind: AffinityKind;
}

export interface DiscoveryTrace {
  requestId: string;
  mode: "live" | "sample";
  userSignals: string[];
  resolvedEntities: AffinityNode[];
  discoveredAffinities: AffinityNode[];
  themeTags: string[];
  matchedCatalogueIds: string[];
  selectedRecommendationIds: string[];
  evidenceCoverage: {
    searchEntities: number;
    insightEntities: number;
    insightTags: number;
    recommendationsWithInsights: number;
    recommendationsDirectOnly: number;
  };
  steps: AgentStep[];
  warnings: string[];
}

export type AgentStepStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface AgentStep {
  id: string;
  label: string;
  status: AgentStepStatus;
  detail?: string;
}

export interface DiscoverSuccess {
  ok: true;
  mode: "live" | "sample";
  profile: TasteProfile;
  recommendations: Recommendation[];
  steps: AgentStep[];
  warnings: string[];
  trace: DiscoveryTrace;
}

export interface DiscoverFailure {
  ok: false;
  mode: "live" | "sample";
  error: {
    code: string;
    message: string;
  };
  steps: AgentStep[];
  trace?: DiscoveryTrace;
}

export type DiscoverResponse = DiscoverSuccess | DiscoverFailure;

export class QlooClientError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "MISSING_API_KEY"
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "RATE_LIMITED"
      | "TIMEOUT"
      | "NOT_FOUND"
      | "BAD_RESPONSE"
      | "NETWORK"
      | "UNKNOWN",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "QlooClientError";
  }
}
