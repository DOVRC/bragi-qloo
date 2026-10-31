"use client";

import type { DiscoverSuccess } from "@/lib/types";

/**
 * Taste DNA — visual summary of real Qloo + catalogue evidence from this run.
 * Does not invent pairwise taste genetics or personal predictions.
 */
export function TasteDna({ result }: { result: DiscoverSuccess }) {
  const { profile, recommendations, trace, mode } = result;
  const domains = collectDomains(result);
  const native = recommendations.filter((r) => r.rankingPath === "qloo_native");
  const creators = recommendations.filter(
    (r) => r.entry.kind === "creator" || r.entry.kind === "project",
  );
  const evidenceTags = [
    ...profile.affinityTags.slice(0, 8),
    ...trace.themeTags.slice(0, 4),
  ].filter((t, i, arr) => arr.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i);

  return (
    <section
      className="rounded-[1.75rem] border border-bragi-ink/8 bg-gradient-to-br from-white via-bragi-paper/80 to-bragi-mist/25 p-5 sm:p-7"
      aria-labelledby="taste-dna-heading"
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-bragi-navy/45">
        Taste DNA
      </p>
      <h3 id="taste-dna-heading" className="mt-1 font-display text-2xl text-bragi-navy">
        Evidence shape of this run
      </h3>
      <p className="mt-2 max-w-2xl text-sm text-bragi-navy/60">
        Built only from Qloo Search / Tags / Insights plus Bragi catalogue matches in this
        response — not a stored user profile
        {mode === "sample" ? " (sample mode)." : "."}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Resolved entities" value={String(profile.resolvedEntities.length)} />
        <Stat label="Insights affinities" value={String(profile.affinityEntities.length)} />
        <Stat
          label="Match mix"
          value={`${native.length} native · ${creators.length} creator/space · ${recommendations.length} total`}
        />
      </div>

      {domains.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-bragi-accent">
            Cultural domains in play
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {domains.map((d) => (
              <span
                key={d}
                className="rounded-full bg-bragi-navy px-3 py-1.5 text-xs text-bragi-cream"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.resolvedEntities.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-bragi-accent">
            Qloo-resolved seeds
          </p>
          <ul className="mt-2 space-y-1 text-sm text-bragi-navy/75">
            {profile.resolvedEntities.slice(0, 5).map((e) => (
              <li key={e.id}>
                <span className="font-medium text-bragi-navy">{e.name}</span>
                {e.type ? (
                  <span className="text-bragi-navy/45"> · {shortType(e.type)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {trace.discoveredAffinities.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-bragi-accent">
            Discovered affinities (Insights)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {trace.discoveredAffinities.slice(0, 8).map((a) => (
              <span
                key={a.id}
                className="rounded-full border border-bragi-ink/10 bg-white/80 px-3 py-1.5 text-xs text-bragi-navy/75"
              >
                {a.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {evidenceTags.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-bragi-accent">
            Theme tags
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {evidenceTags.slice(0, 10).map((t) => (
              <span
                key={t}
                className="rounded-full bg-bragi-mist/40 px-2.5 py-1 text-[11px] text-bragi-navy/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-[11px] text-bragi-navy/40">
        Coverage: {trace.evidenceCoverage.searchEntities} Search ·{" "}
        {trace.evidenceCoverage.insightEntities} Insights entities ·{" "}
        {trace.evidenceCoverage.insightTags} tags ·{" "}
        {trace.evidenceCoverage.recommendationsWithInsights} Insights-backed matches
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-bragi-ink/8 bg-white/85 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-bragi-navy/40">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-bragi-navy">{value}</p>
    </div>
  );
}

function shortType(type: string): string {
  const leaf = type.split(":").pop() ?? type;
  return leaf.replace(/_/g, " ");
}

function collectDomains(result: DiscoverSuccess): string[] {
  const out = new Set<string>();
  for (const e of result.profile.resolvedEntities) {
    if (e.type) {
      const label = shortType(e.type);
      if (label && label !== "entity") out.add(label);
    }
  }
  for (const e of result.profile.affinityEntities.slice(0, 8)) {
    if (e.type) {
      const label = shortType(e.type);
      if (label && label !== "entity") out.add(label);
    }
  }
  for (const r of result.recommendations) {
    out.add(r.entry.category.replace(/_/g, " "));
  }
  return [...out].slice(0, 8);
}
