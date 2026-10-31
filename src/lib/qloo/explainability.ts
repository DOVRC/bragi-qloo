/** Normalized Qloo Insights explainability (never invent contributions). */

export interface ExplainabilityContribution {
  /** Input entity id when available */
  entityId?: string;
  /** Position / key from Qloo payload when id is absent */
  key: string;
  /** Normalized influence in [0, 1] when Qloo provides a numeric score */
  score?: number;
}

export interface CandidateExplainability {
  scope: "candidate";
  /** True only when candidate-specific contribution scores exist */
  available: boolean;
  warning?: string;
  contributions: ExplainabilityContribution[];
}

export interface AggregateExplainability {
  scope: "aggregate";
  /** True only when aggregate contribution scores exist (not warning-only) */
  available: boolean;
  warning?: string;
  contributions: ExplainabilityContribution[];
}

/** @deprecated use CandidateExplainability / AggregateExplainability */
export type NormalizedExplainability = CandidateExplainability | AggregateExplainability;

/**
 * Extract explainability block from a payload fragment.
 * `available` is true only when contribution scores exist — a warning alone is not success.
 */
function parseExplainabilityBlock(
  expl: Record<string, unknown> | null,
  scope: "candidate" | "aggregate",
): CandidateExplainability | AggregateExplainability {
  const empty =
    scope === "candidate"
      ? ({ scope: "candidate", available: false, contributions: [] } as CandidateExplainability)
      : ({ scope: "aggregate", available: false, contributions: [] } as AggregateExplainability);

  if (!expl) return empty;

  const warning =
    typeof expl.warning === "string" && expl.warning.trim()
      ? expl.warning.trim()
      : undefined;

  const signalBlock =
    expl["signal.interests.entities"] ??
    expl.entities ??
    expl.signals ??
    expl.contributions;

  const contributions: ExplainabilityContribution[] = [];

  if (Array.isArray(signalBlock)) {
    for (let i = 0; i < signalBlock.length; i++) {
      const item = signalBlock[i];
      if (typeof item === "number") {
        contributions.push({ key: String(i), score: clamp01(item) });
      } else if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const entityId =
          pickString(row.entity_id) ?? pickString(row.id) ?? pickString(row.entityId);
        const scoreRaw = row.score ?? row.weight ?? row.influence ?? row.value;
        contributions.push({
          key: entityId ?? String(i),
          entityId,
          score: typeof scoreRaw === "number" ? clamp01(scoreRaw) : undefined,
        });
      }
    }
  } else if (signalBlock && typeof signalBlock === "object") {
    for (const [key, value] of Object.entries(signalBlock as Record<string, unknown>)) {
      if (typeof value === "number") {
        contributions.push({
          key,
          entityId: looksLikeId(key) ? key : undefined,
          score: clamp01(value),
        });
      } else if (value && typeof value === "object") {
        const row = value as Record<string, unknown>;
        const scoreRaw = row.score ?? row.weight ?? row.influence ?? row.value;
        contributions.push({
          key,
          entityId:
            pickString(row.entity_id) ??
            pickString(row.id) ??
            (looksLikeId(key) ? key : undefined),
          score: typeof scoreRaw === "number" ? clamp01(scoreRaw) : undefined,
        });
      }
    }
  }

  const hasScores = contributions.some((c) => typeof c.score === "number");
  if (scope === "candidate") {
    return {
      scope: "candidate",
      available: hasScores,
      warning,
      contributions: hasScores ? contributions : [],
    };
  }
  return {
    scope: "aggregate",
    available: hasScores,
    warning,
    contributions: hasScores ? contributions : [],
  };
}

function extractExplObject(source: unknown): Record<string, unknown> | null {
  if (!source || typeof source !== "object") return null;
  const root = source as Record<string, unknown>;
  const query =
    root.query && typeof root.query === "object"
      ? (root.query as Record<string, unknown>)
      : root;
  if (query.explainability && typeof query.explainability === "object") {
    return query.explainability as Record<string, unknown>;
  }
  if (root.explainability && typeof root.explainability === "object") {
    return root.explainability as Record<string, unknown>;
  }
  return null;
}

/** Per-entity / per-recommendation explainability only. */
export function normalizeCandidateExplainability(entitySource: unknown): CandidateExplainability {
  return parseExplainabilityBlock(extractExplObject(entitySource), "candidate") as CandidateExplainability;
}

/** Top-level Insights response explainability (result-set average). */
export function normalizeAggregateExplainability(responseSource: unknown): AggregateExplainability {
  return parseExplainabilityBlock(extractExplObject(responseSource), "aggregate") as AggregateExplainability;
}

/**
 * @deprecated Prefer normalizeCandidateExplainability / normalizeAggregateExplainability.
 * Kept for older call sites — defaults to candidate scope.
 */
export function normalizeExplainability(source: unknown): CandidateExplainability {
  return normalizeCandidateExplainability(source);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function looksLikeId(value: string): boolean {
  return /^[0-9A-Fa-f-]{8,}$/.test(value) || value.includes("-");
}
