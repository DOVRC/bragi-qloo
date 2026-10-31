import type { Recommendation } from "@/lib/types";

/**
 * Put refinement evidence first so DiscoveryAgent's 5-signal resolve budget
 * actually searches the new tastes — not only the original chip list.
 */
export function moreLikeSignals(
  rec: Recommendation,
  current: string[],
): { signals: string[]; priority: string[] } {
  const boost: string[] = [];
  for (const c of rec.contributions) {
    if (
      c.kind === "qloo_insights_entity" ||
      c.kind === "qloo_insights_tag" ||
      c.kind === "qloo_search" ||
      c.kind === "qloo_explainability"
    ) {
      if (c.label && c.label.length > 1 && c.label.length < 60) boost.push(c.label);
    }
  }
  for (const hook of rec.entry.culturalHooks.slice(0, 3)) {
    if (hook.length > 2 && hook.length < 40) boost.push(hook);
  }
  const priority = uniquePreserve(boost).slice(0, 5);
  const signals = uniquePreserve([...priority, ...current]).slice(0, 8);
  return { signals, priority };
}

export function pickNextSurpriseAffinity(
  affinities: Array<{ name: string }>,
  usedNames: string[],
  cursor: number,
): { name: string } | null {
  if (!affinities.length) return null;
  const used = new Set(usedNames.map((n) => n.toLowerCase()));
  for (const a of affinities) {
    if (!used.has(a.name.toLowerCase())) return a;
  }
  return affinities[cursor % affinities.length] ?? null;
}

export function uniquePreserve(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}
