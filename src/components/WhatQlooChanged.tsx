"use client";

import { useMemo } from "react";
import { computeQlooDelta } from "@/lib/qlooDelta";
import type { DiscoverSuccess } from "@/lib/types";

export function WhatQlooChanged({ result }: { result: DiscoverSuccess }) {
  const delta = useMemo(() => computeQlooDelta(result), [result]);

  return (
    <section
      aria-label="What Qloo changed"
      className="rounded-[1.5rem] border border-bragi-ink/10 bg-white p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bragi-accent">
        Cultural intelligence
      </p>
      <h3 className="mt-1 font-display text-2xl text-bragi-navy">What Qloo changed</h3>
      <p className="mt-1.5 max-w-2xl text-sm text-bragi-navy/60">
        Same input, two views: direct catalogue overlap from your words vs the actual run after
        Search / Tags / Insights. No extra API calls — and no invented improvements.
      </p>

      <p className="mt-4 rounded-2xl bg-bragi-paper/80 px-4 py-3 text-sm text-bragi-navy/75">
        {delta.note}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-bragi-ink/8 bg-bragi-cream/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-bragi-navy/40">
            Without Insights enrichment
          </p>
          <p className="mt-2 text-sm text-bragi-navy/80">
            {delta.baselineNames.length
              ? delta.baselineNames.join(" · ")
              : "No catalogue hits from user signals alone"}
          </p>
        </div>
        <div className="rounded-2xl border border-bragi-accent/25 bg-bragi-accent/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-bragi-accent">
            With this Qloo-backed run
          </p>
          <p className="mt-2 text-sm text-bragi-navy/80">
            {delta.enrichedNames.length
              ? delta.enrichedNames.join(" · ")
              : "No recommendations cleared the evidence threshold"}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-bragi-navy/40">
            New cultural entities from Insights
          </dt>
          <dd className="mt-1 text-bragi-navy/75">
            {delta.newAffinityNames.length
              ? delta.newAffinityNames.slice(0, 8).join(" · ")
              : "None beyond your signals / Search resolves"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-bragi-navy/40">
            Newly surfaced local matches
          </dt>
          <dd className="mt-1 text-bragi-navy/75">
            {delta.newlySurfacedNames.length
              ? delta.newlySurfacedNames.join(" · ")
              : "None — top set overlaps the direct baseline"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-bragi-navy/40">
            Depend on Qloo evidence
          </dt>
          <dd className="mt-1 text-bragi-navy/75">
            {delta.qlooDependentNames.length
              ? delta.qlooDependentNames.join(" · ")
              : "None in this run"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-bragi-navy/40">
            Direct catalogue / signal overlap
          </dt>
          <dd className="mt-1 text-bragi-navy/75">
            {delta.directCatalogueNames.length
              ? delta.directCatalogueNames.join(" · ")
              : "None labeled as direct-only"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
