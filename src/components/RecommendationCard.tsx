"use client";

import { useState } from "react";
import type { Recommendation } from "@/lib/types";
import { categoryArtClass, categoryLabel } from "./categoryVisual";

export function RecommendationCard({
  recommendation,
  rank,
}: {
  recommendation: Recommendation;
  rank: number;
}) {
  const [open, setOpen] = useState(rank === 0);
  const { entry, explanation, evidence } = recommendation;

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-bragi-ink/10 bg-white shadow-[0_10px_30px_rgba(16,24,40,0.06)] transition duration-200 ease-out hover:shadow-[0_14px_36px_rgba(16,24,40,0.1)]">
      <div
        className={`relative h-28 bg-gradient-to-br sm:h-32 ${categoryArtClass(entry.category)}`}
        aria-hidden
      >
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_30%,rgba(253,245,235,0.55),transparent_42%),radial-gradient(circle_at_80%_70%,rgba(16,24,40,0.35),transparent_45%)]" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
          <span className="rounded-full bg-bragi-cream/95 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-bragi-navy">
            {categoryLabel(entry.category)}
          </span>
          <span className="text-xs font-medium text-bragi-cream/90">Match {rank + 1}</span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="font-display text-2xl leading-tight text-bragi-navy">{entry.name}</h3>
        <p className="mt-1.5 text-sm text-bragi-navy/55">
          {entry.neighborhood}, {entry.city}
          {entry.typicalCostCop != null && (
            <>
              {" "}
              · about COP {entry.typicalCostCop.toLocaleString("es-CO")}
              <span className="text-bragi-navy/35"> (indicative, not a live ticket)</span>
            </>
          )}
        </p>

        {entry.provenance === "demonstration" ? (
          <p className="mt-3 inline-block rounded-full border border-amber-500/35 bg-amber-50 px-2.5 py-1 text-xs text-amber-900">
            Demonstration catalogue profile
          </p>
        ) : (
          <p className="mt-3 inline-block rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900">
            Verified public venue / program
          </p>
        )}

        <p className="mt-4 text-[15px] leading-relaxed text-bragi-navy/80">{entry.summary}</p>

        <div className="mt-4 rounded-2xl bg-bragi-paper/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-bragi-accent">
            Why you&apos;ll like this
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-bragi-navy/75">{explanation}</p>
        </div>

        <button
          type="button"
          className="mt-4 text-sm font-semibold text-bragi-accent transition duration-200 ease-out hover:underline"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide how we found this" : "How we found this"}
        </button>

        {open && (
          <div className="mt-3 space-y-2 rounded-2xl border border-bragi-ink/8 bg-bragi-cream/50 p-4 text-sm text-bragi-navy/75">
            <p className="text-xs uppercase tracking-wider text-bragi-navy/45">Evidence</p>
            <ul className="space-y-2">
              {evidence.map((ev, i) => (
                <li key={`${entry.id}-ev-${i}`}>
                  <span className="font-medium text-bragi-navy/55">[{labelSource(ev.source)}]</span>{" "}
                  {ev.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-bragi-ink/8 pt-4">
          <p className="flex-1 text-sm text-bragi-navy/75">
            <span className="font-semibold text-bragi-navy">Next step:</span> {entry.actionHint}
          </p>
          {entry.publicUrl && (
            <a
              href={entry.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full bg-bragi-navy px-4 text-sm font-semibold text-bragi-cream transition duration-200 ease-out hover:bg-bragi-ink"
            >
              Official site
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function labelSource(source: string): string {
  switch (source) {
    case "qloo_search":
      return "Qloo Search";
    case "qloo_insights":
      return "Qloo Insights";
    case "user_signal":
      return "Your preference";
    case "catalogue":
      return "Bragi catalogue";
    default:
      return source;
  }
}
