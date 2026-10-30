import type { CulturalSignal, QlooEntity, QlooEntityType } from "@/lib/types";
import type { QlooService } from "@/lib/qloo/client";

export interface ResolvedSignal {
  signal: CulturalSignal;
  entity: QlooEntity | null;
  strategy: string;
  warning?: string;
}

/** Prefer exact / substring name matches over popularity alone. */
export function scoreNameMatch(query: string, candidateName: string): number {
  const q = normalizeName(query);
  const c = normalizeName(candidateName);
  if (!q || !c) return 0;
  if (q === c) return 100;
  if (c.startsWith(q) || q.startsWith(c)) return 90;
  if (c.includes(q) || q.includes(c)) return 75;

  const qTokens = new Set(q.split(/\s+/).filter((t) => t.length > 2));
  const cTokens = c.split(/\s+/).filter((t) => t.length > 2);
  if (qTokens.size === 0) return 0;
  let overlap = 0;
  for (const t of cTokens) if (qTokens.has(t)) overlap += 1;
  return Math.round((overlap / qTokens.size) * 60);
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function pickBestEntity(
  query: string,
  entities: QlooEntity[],
  minScore = 40,
): QlooEntity | null {
  let best: QlooEntity | null = null;
  let bestScore = -1;
  for (const entity of entities) {
    const nameScore = scoreNameMatch(query, entity.name);
    const popBoost = typeof entity.popularity === "number" ? entity.popularity * 5 : 0;
    const score = nameScore + popBoost;
    if (score > bestScore) {
      bestScore = score;
      best = entity;
    }
  }
  if (!best || scoreNameMatch(query, best.name) < minScore) return null;
  return best;
}

/**
 * Resolve a cultural signal to a Qloo entity.
 * Typed search can return noisy results (observed live for Studio Ghibli + movie/brand filters),
 * so we fall back to untyped search and require a name match.
 */
export async function resolveSignalEntity(
  qloo: QlooService,
  signal: CulturalSignal,
): Promise<ResolvedSignal> {
  const attempts: Array<{ label: string; types?: QlooEntityType[] }> = [];

  if (signal.kind === "genre_or_theme") {
    attempts.push({ label: "untyped-genre" });
    if (signal.inferredType) {
      attempts.push({ label: `typed-genre:${signal.inferredType}`, types: [signal.inferredType] });
    }
  } else {
    if (signal.inferredType) {
      attempts.push({
        label: `typed:${signal.inferredType}`,
        types: [signal.inferredType],
      });
    }
    attempts.push({ label: "untyped" });
  }

  const warnings: string[] = [];

  for (const attempt of attempts) {
    const found = await qloo.searchEntities({
      query: signal.raw,
      types: attempt.types,
      take: 5,
    });
    const best = pickBestEntity(signal.raw, found, signal.kind === "genre_or_theme" ? 25 : 40);
    if (best) {
      return {
        signal,
        entity: best,
        strategy: attempt.label,
      };
    }
    if (found.length > 0) {
      warnings.push(
        `Search (${attempt.label}) returned ${found.length} hit(s) but none matched “${signal.raw}” closely enough.`,
      );
    }
  }

  return {
    signal,
    entity: null,
    strategy: "unresolved",
    warning:
      warnings[0] ??
      `No Qloo entity could be confidently resolved for “${signal.raw}”.`,
  };
}
