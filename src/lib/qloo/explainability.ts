/** Normalized Qloo Insights explainability (never invent contributions). */

export interface ExplainabilityContribution {
  /** Input entity id when available */
  entityId?: string;
  /** Position / key from Qloo payload when id is absent */
  key: string;
  /** Normalized influence in [0, 1] when Qloo provides a numeric score */
  score?: number;
}

export interface NormalizedExplainability {
  available: boolean;
  warning?: string;
  /** Per-result contributions keyed under signal.interests.entities */
  contributions: ExplainabilityContribution[];
  /** Aggregate / top-level payload keys for debugging (no secrets) */
  aggregateKeys: string[];
}

/**
 * Extract explainability from an Insights response entity or top-level query object.
 * Supports shapes observed on the hackathon API (2026-10-30).
 */
export function normalizeExplainability(source: unknown): NormalizedExplainability {
  if (!source || typeof source !== "object") {
    return { available: false, contributions: [], aggregateKeys: [] };
  }

  const root = source as Record<string, unknown>;
  const query =
    root.query && typeof root.query === "object"
      ? (root.query as Record<string, unknown>)
      : root;
  const expl =
    (query.explainability && typeof query.explainability === "object"
      ? (query.explainability as Record<string, unknown>)
      : null) ||
    (root.explainability && typeof root.explainability === "object"
      ? (root.explainability as Record<string, unknown>)
      : null);

  if (!expl) {
    return { available: false, contributions: [], aggregateKeys: [] };
  }

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
          entityId: entityId,
          score: typeof scoreRaw === "number" ? clamp01(scoreRaw) : undefined,
        });
      }
    }
  } else if (signalBlock && typeof signalBlock === "object") {
    for (const [key, value] of Object.entries(signalBlock as Record<string, unknown>)) {
      if (typeof value === "number") {
        contributions.push({ key, entityId: looksLikeId(key) ? key : undefined, score: clamp01(value) });
      } else if (value && typeof value === "object") {
        const row = value as Record<string, unknown>;
        const scoreRaw = row.score ?? row.weight ?? row.influence ?? row.value;
        contributions.push({
          key,
          entityId: pickString(row.entity_id) ?? pickString(row.id) ?? (looksLikeId(key) ? key : undefined),
          score: typeof scoreRaw === "number" ? clamp01(scoreRaw) : undefined,
        });
      }
    }
  }

  return {
    available: contributions.length > 0 || Boolean(warning),
    warning,
    contributions,
    aggregateKeys: Object.keys(expl),
  };
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
