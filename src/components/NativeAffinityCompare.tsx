"use client";

import type { Recommendation } from "@/lib/types";

/**
 * Compact native affinity comparison — only when ≥2 Qloo-native candidates
 * expose query.affinity. Does not invent comparable Bragi scores.
 */
export function NativeAffinityCompare({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  const native = recommendations.filter(
    (r) => r.rankingPath === "qloo_native" && r.qlooNativeAffinity != null,
  );
  if (native.length < 2) return null;

  const max = Math.max(...native.map((r) => r.qlooNativeAffinity ?? 0), 0.01);

  return (
    <section
      className="rounded-[1.5rem] border border-bragi-ink/8 bg-white/95 p-5"
      aria-labelledby="native-compare-heading"
    >
      <h3 id="native-compare-heading" className="font-display text-xl text-bragi-navy">
        Qloo native affinity comparison
      </h3>
      <p className="mt-1 text-sm text-bragi-navy/60">
        Same Insights request, contextual <code className="text-xs">query.affinity</code> only —
        not popularity, not Bragi catalogue points.
      </p>
      <ul className="mt-4 space-y-3">
        {native.map((r) => {
          const affinity = r.qlooNativeAffinity ?? 0;
          const pct = Math.round((affinity / max) * 100);
          const inputs = r.qlooExplainability?.available
            ? r.qlooExplainability.contributions
                .slice(0, 3)
                .map((c) => c.entityName ?? c.key)
                .filter(Boolean)
            : [];
          return (
            <li key={r.entry.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-bragi-navy">{r.entry.name}</span>
                <span className="font-mono text-xs text-bragi-navy/55">{affinity.toFixed(3)}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bragi-paper">
                <div
                  className="h-full rounded-full bg-bragi-accent/80 transition-[width] duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {inputs.length > 0 && (
                <p className="mt-1 text-[11px] text-bragi-navy/45">
                  Candidate explainability inputs: {inputs.join(" · ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
