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

export interface TasteEvidence {
  source: "qloo_search" | "qloo_insights" | "user_signal" | "catalogue";
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
}

export interface Recommendation {
  entry: CatalogueEntry;
  score: number;
  explanation: string;
  evidence: TasteEvidence[];
  refinementSuggestions: string[];
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
}

export interface DiscoverFailure {
  ok: false;
  mode: "live" | "sample";
  error: {
    code: string;
    message: string;
  };
  steps: AgentStep[];
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
