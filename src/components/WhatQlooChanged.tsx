"use client";

import { useMemo } from "react";
import { computeQlooDelta } from "@/lib/qlooDelta";
import type { DiscoverSuccess, DiscoveryIntent } from "@/lib/types";

export function WhatQlooChanged({
  result,
  intent,
  excludeEntryIds = [],
}: {
  result: DiscoverSuccess;
  intent: DiscoveryIntent;
  excludeEntryIds?: string[];
}) {
  const delta = useMemo(
    () => computeQlooDelta(result, undefined, { intent, excludeEntryIds }),
    [result, intent, excludeEntryIds],
  );

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
        Same city, intent, budget floor, and exclusions. Path B compares your words alone vs
        Search/Insights-enriched catalogue matching — no extra API calls, no invented lifts.
      </p>

      <p className="mt-4 rounded-2xl bg-bragi-paper/80 px-4 py-3 text-sm text-bragi-navy/75">
        {delta.note}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-bragi-navy/45">{delta.comparabilityNote}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-bragi-ink/8 bg-bragi-cream/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-bragi-navy/40">
            Path B — user signals only
          </p>
          <p className="mt-2 text-sm text-bragi-navy/80">
            {delta.baselineNames.length
              ? delta.baselineNames.join(" · ")
              : "No catalogue hits cleared the evidence threshold from signals alone"}
          </p>
        </div>
        <div className="rounded-2xl border border-bragi-accent/25 bg-bragi-accent/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-bragi-accent">
            Path B — with Search / Insights
          </p>
          <p className="mt-2 text-sm text-bragi-navy/80">
            {delta.pathBEnrichedNames.length
              ? delta.pathBEnrichedNames.join(" · ")
              : "No Path B hits after enrichment"}
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
            Newly surfaced by Qloo evidence (Path B)
          </dt>
          <dd className="mt-1 text-bragi-navy/75">
            {delta.newlySurfacedByQlooEvidence.length
              ? delta.newlySurfacedByQlooEvidence.join(" · ")
              : "None — Path B overlaps the direct baseline"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-bragi-navy/40">
            Shown in UI (may include native Path A)
          </dt>
          <dd className="mt-1 text-bragi-navy/75">
            {delta.enrichedNames.length ? delta.enrichedNames.join(" · ") : "None"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-bragi-navy/40">
            Depend on Qloo evidence (UI cards)
          </dt>
          <dd className="mt-1 text-bragi-navy/75">
            {delta.qlooDependentNames.length
              ? delta.qlooDependentNames.join(" · ")
              : "None in this run"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
