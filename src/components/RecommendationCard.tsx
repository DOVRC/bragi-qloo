"use client";

import { useState } from "react";
import type { Recommendation } from "@/lib/types";

export function RecommendationCard({
  recommendation,
  rank,
}: {
  recommendation: Recommendation;
  rank: number;
}) {
  const [open, setOpen] = useState(rank === 0);
  const { entry, score, explanation, evidence } = recommendation;

  return (
    <article className="rounded-2xl border border-bragi-ink/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-bragi-navy/40">
            #{rank + 1} · {entry.category.replace("_", " ")}
          </p>
          <h3 className="mt-1 font-display text-2xl text-bragi-navy">{entry.name}</h3>
          <p className="mt-1 text-sm text-bragi-navy/55">
            {entry.neighborhood}, {entry.city}
            {entry.typicalCostCop != null && (
              <>
                {" "}
                · indicative ~COP {entry.typicalCostCop.toLocaleString("es-CO")}{" "}
                <span className="text-bragi-navy/35">(not a live ticket price)</span>
              </>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-bragi-navy/40">
            Bragi rank score
          </p>
          <p className="font-display text-xl text-bragi-accent">{score.toFixed(1)}</p>
          <p className="max-w-[10rem] text-[11px] leading-snug text-bragi-navy/40">
            Internal matching metric — not a Qloo probability
          </p>
        </div>
      </div>

      {entry.provenance === "demonstration" ? (
        <p className="mt-3 inline-block rounded-md border border-amber-500/40 bg-amber-50 px-2 py-1 text-xs text-amber-900">
          Demonstration catalogue profile
        </p>
      ) : (
        <p className="mt-3 inline-block rounded-md border border-emerald-600/25 bg-emerald-50 px-2 py-1 text-xs text-emerald-900">
          Verified public venue / program
        </p>
      )}

      <p className="mt-4 text-bragi-navy/80">{entry.summary}</p>
      <p className="mt-3 text-sm leading-relaxed text-bragi-navy/70">{explanation}</p>

      <button
        type="button"
        className="mt-4 text-sm font-semibold text-bragi-accent underline-offset-4 hover:underline"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide why this matches" : "Why this matches"}
      </button>

      {open && (
        <div className="mt-3 space-y-2 rounded-xl bg-bragi-paper/80 p-4 text-sm text-bragi-navy/75">
          <p className="text-xs uppercase tracking-wider text-bragi-navy/45">
            Evidence classification
          </p>
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

      <p className="mt-5 text-sm text-bragi-navy/80">
        <span className="font-semibold text-bragi-navy">Next step:</span> {entry.actionHint}
        {entry.publicUrl && (
          <>
            {" "}
            <a
              href={entry.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-bragi-accent underline-offset-4 hover:underline"
            >
              Official site
            </a>
          </>
        )}
      </p>
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
