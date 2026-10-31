"use client";

import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import type { EvidenceStrength, Recommendation } from "@/lib/types";
import { categoryArtClass, categoryLabel } from "./categoryVisual";

export function RecommendationCard({
  recommendation,
  rank,
  highlighted = false,
  onMoreLikeThis,
  onNotMyStyle,
}: {
  recommendation: Recommendation;
  rank: number;
  highlighted?: boolean;
  onMoreLikeThis?: (recommendation: Recommendation) => void;
  onNotMyStyle?: (recommendation: Recommendation) => void;
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
        {(entry.kind === "creator" || entry.kind === "project") && (
          <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-bragi-cream/95 font-display text-xl text-bragi-navy shadow-sm">
            {entry.name.trim().charAt(0).toUpperCase()}
          </div>
        )}
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
          {entry.discipline && (
            <>
              {" "}
              · {entry.discipline}
            </>
          )}
          {entry.typicalCostCop != null && (
            <>
              {" "}
              · about COP {entry.typicalCostCop.toLocaleString("es-CO")}
              <span className="text-bragi-navy/35"> (indicative)</span>
            </>
          )}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {entry.provenance === "demonstration" ? (
            <p className="inline-block rounded-full border border-amber-500/35 bg-amber-50 px-2.5 py-1 text-xs text-amber-900">
              Demonstration catalogue profile
            </p>
          ) : entry.kind === "creator" ? (
            <p className="inline-block rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900">
              Independent creator
            </p>
          ) : entry.kind === "project" ? (
            <p className="inline-block rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900">
              Creative project / space
            </p>
          ) : (
            <p className="inline-block rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900">
              Verified public venue / program
            </p>
          )}
          {recommendation.rankingPath === "qloo_native" ? (
            <p className="inline-block rounded-full border border-bragi-accent/30 bg-bragi-mist/50 px-2.5 py-1 text-xs text-bragi-navy">
              Ranked by Qloo Insights
            </p>
          ) : (
            <p className="inline-block rounded-full border border-bragi-ink/10 bg-bragi-paper/80 px-2.5 py-1 text-xs text-bragi-navy/70">
              Bragi catalogue match
            </p>
          )}
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-bragi-navy/80">{entry.summary}</p>

        <ProvenanceBreakdown recommendation={recommendation} />

        <div className="mt-4 rounded-2xl bg-bragi-paper/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-bragi-accent">
            Why this{" "}
            {entry.kind === "creator"
              ? "creator"
              : entry.kind === "project"
                ? "creative space"
                : "place"}{" "}
            fits your taste
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-bragi-navy/75">{explanation}</p>
          <p className="mt-2 text-[11px] text-bragi-navy/40">
            Aggregate cultural affinities — not a personal prediction. Bragi scores are not Qloo scores.
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

        {(onMoreLikeThis || onNotMyStyle) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {onMoreLikeThis && (
              <button
                type="button"
                onClick={() => onMoreLikeThis(recommendation)}
                className="min-h-10 rounded-full border border-bragi-accent/30 bg-bragi-accent/10 px-4 text-xs font-semibold text-bragi-navy transition duration-200 ease-out hover:border-bragi-accent/50"
              >
                More like this
              </button>
            )}
            {onNotMyStyle && (
              <button
                type="button"
                onClick={() => onNotMyStyle(recommendation)}
                className="min-h-10 rounded-full border border-bragi-ink/15 bg-white px-4 text-xs font-semibold text-bragi-navy/70 transition duration-200 ease-out hover:border-bragi-ink/30"
              >
                Not my style
              </button>
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
              {entry.kind === "creator"
                ? "Explore portfolio"
                : entry.kind === "project"
                  ? "Visit project"
                  : "Official site"}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function ProvenanceBreakdown({ recommendation }: { recommendation: Recommendation }) {
  const { entry } = recommendation;
  const interests = recommendation.contributions
    .filter((c) => c.kind === "user_signal")
    .map((c) => c.label);
  const qlooBits = recommendation.contributions.filter(
    (c) =>
      c.kind === "qloo_search" ||
      c.kind === "qloo_insights_entity" ||
      c.kind === "qloo_insights_tag" ||
      c.kind === "qloo_native_affinity" ||
      c.kind === "qloo_explainability",
  );
  const expl = recommendation.qlooExplainability;

  return (
    <div className="mt-4 grid gap-2 rounded-2xl border border-bragi-ink/8 bg-white/70 p-3 text-xs text-bragi-navy/70 sm:grid-cols-2">
      <div>
        <p className="font-semibold uppercase tracking-wider text-bragi-navy/40">Your interests</p>
        <p className="mt-1">
          {interests.length
            ? interests.slice(0, 4).join(" · ")
            : "Used as signals for Search / Insights (see Why panel)."}
        </p>
      </div>
      <div>
        <p className="font-semibold uppercase tracking-wider text-bragi-navy/40">
          What Qloo discovered
        </p>
        <p className="mt-1">
          {qlooBits.length
            ? qlooBits
                .slice(0, 4)
                .map((c) => c.label)
                .join(" · ")
            : "No Qloo contribution on this card."}
        </p>
        {expl?.available && expl.scope === "candidate" && (
          <p className="mt-1 text-[11px] text-bragi-navy/45">
            Candidate explainability from Qloo (0–1) — not aggregate, not Bragi points.
          </p>
        )}
        {recommendation.qlooAggregateExplainability?.available && (
          <p className="mt-1 text-[11px] text-bragi-navy/40">
            A separate aggregate explainability exists for the overall Insights set (not shown as
            this card’s contributions).
          </p>
        )}
      </div>
      <div>
        <p className="font-semibold uppercase tracking-wider text-bragi-navy/40">What Bragi matched</p>
        <p className="mt-1">
          {entry.name}
          {entry.kind === "creator"
            ? " (independent creator catalogue)"
            : entry.qlooEntityId
              ? " (catalogue + verified Medellín Qloo place id)"
              : " (local catalogue)"}
        </p>
      </div>
      <div>
        <p className="font-semibold uppercase tracking-wider text-bragi-navy/40">Why selected</p>
        <p className="mt-1">
          {recommendation.rankingPath === "qloo_native"
            ? recommendation.qlooNativeAffinity != null
              ? `Qloo Insights query.affinity ${recommendation.qlooNativeAffinity.toFixed(2)}`
              : "Qloo Insights candidate (affinity not provided — no invented score)"
            : `Bragi evidence-aware catalogue score (${recommendation.score.toFixed(1)} pts)`}
          {recommendation.domainChangeEstablished ? " · domain change established" : ""}
        </p>
      </div>
    </div>
  );
}

function strengthLabel(s: EvidenceStrength): string {
  switch (s) {
    case "cross_domain_affinity":
      return "Cross-domain affinity";
    case "qloo_backed_affinity":
      return "Qloo-backed affinity";
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
