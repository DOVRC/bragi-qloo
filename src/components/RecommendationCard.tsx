"use client";

import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import type { EvidenceStrength, Recommendation } from "@/lib/types";
import { categoryArtClass, categoryLabel } from "./categoryVisual";

export function RecommendationCard({
  recommendation,
  rank,
  highlighted = false,
}: {
  recommendation: Recommendation;
  rank: number;
  highlighted?: boolean;
}) {
  const [open, setOpen] = useState(rank === 0);
  const [advanced, setAdvanced] = useState(false);
  const { entry, explanation, evidence, evidenceStrength } = recommendation;

  return (
    <article
      className={`overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_10px_30px_rgba(16,24,40,0.06)] transition duration-200 ease-out ${
        highlighted
          ? "border-bragi-accent ring-2 ring-bragi-accent/30"
          : "border-bragi-ink/10 hover:shadow-[0_14px_36px_rgba(16,24,40,0.1)]"
      }`}
    >
      <div
        className={`relative h-28 bg-gradient-to-br sm:h-32 ${categoryArtClass(entry.category)}`}
        aria-hidden
      >
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_30%,rgba(253,245,235,0.55),transparent_42%),radial-gradient(circle_at_80%_70%,rgba(16,24,40,0.35),transparent_45%)]" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
          <span className="rounded-full bg-bragi-cream/95 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-bragi-navy">
            {categoryLabel(entry.category)}
          </span>
          <span className="rounded-full bg-bragi-ink/55 px-2.5 py-1 text-[11px] font-medium text-bragi-cream">
            {strengthLabel(evidenceStrength)}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="font-display text-2xl leading-tight text-bragi-navy">{entry.name}</h3>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-bragi-navy/55">
          <MapPin className="inline h-3.5 w-3.5" aria-hidden />
          {entry.neighborhood}, {entry.city}
          {entry.typicalCostCop != null && (
            <>
              {" "}
              · about COP {entry.typicalCostCop.toLocaleString("es-CO")}
              <span className="text-bragi-navy/35"> (indicative)</span>
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
            Why this place fits your taste
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-bragi-navy/75">{explanation}</p>
          <p className="mt-2 text-[11px] text-bragi-navy/40">
            Aggregate cultural affinities — not a personal prediction.
          </p>
        </div>

        {recommendation.contributions.filter((c) => c.kind.startsWith("qloo")).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recommendation.contributions
              .filter((c) => c.kind !== "catalogue" && c.kind !== "user_signal")
              .slice(0, 5)
              .map((c) => (
                <span
                  key={`${c.kind}-${c.label}`}
                  className="rounded-full bg-bragi-mist/40 px-2.5 py-1 text-[11px] text-bragi-navy/70"
                >
                  {c.label}
                </span>
              ))}
          </div>
        )}

        <button
          type="button"
          className="mt-4 text-sm font-semibold text-bragi-accent transition duration-200 ease-out hover:underline"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide evidence" : "How we found this"}
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
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-bragi-navy/50 hover:underline"
              onClick={() => setAdvanced((v) => !v)}
            >
              {advanced ? "Hide technical detail" : "Show technical detail"}
            </button>
            {advanced && (
              <p className="break-words font-mono text-[11px] text-bragi-navy/55">
                {recommendation.judgeExplanation}
              </p>
            )}
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
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-bragi-navy px-4 text-sm font-semibold text-bragi-cream transition duration-200 ease-out hover:bg-bragi-ink"
            >
              Official site
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function strengthLabel(s: EvidenceStrength): string {
  switch (s) {
    case "cross_domain_affinity":
      return "Cross-domain affinity";
    case "direct_taste_match":
      return "Direct taste match";
    case "catalogue_supported":
      return "Catalogue-supported";
    default:
      return "Limited evidence";
  }
}

function labelSource(source: string): string {
  switch (source) {
    case "qloo_search":
      return "Qloo Search";
    case "qloo_tags":
      return "Qloo Tags";
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
