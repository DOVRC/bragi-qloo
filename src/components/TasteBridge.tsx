"use client";

import type { TasteBridge as TasteBridgeModel } from "@/lib/tasteBridge";

const KIND_LABEL: Record<TasteBridgeModel["steps"][number]["kind"], string> = {
  user_interest: "Your interest",
  qloo_resolved: "Qloo resolved",
  qloo_affinity: "Qloo discovered",
  bragi_match: "Bragi local match",
  portfolio: "Explore the work",
};

export function TasteBridgePanel({ bridge }: { bridge: TasteBridgeModel }) {
  return (
    <section
      aria-label="Taste to creator bridge"
      className="rounded-[1.5rem] border border-bragi-ink/10 bg-gradient-to-br from-bragi-cream via-white to-bragi-mist/30 p-5 shadow-[0_10px_28px_rgba(16,24,40,0.05)] sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bragi-accent">
        Taste → local creator
      </p>
      <h3 className="mt-1 font-display text-2xl text-bragi-navy">How this match was formed</h3>
      <p className="mt-1.5 max-w-2xl text-sm text-bragi-navy/60">
        Only hops backed by this run’s evidence. Catalogue overlap is labeled as Bragi’s — not as a
        Qloo ranking — unless Insights ranked a verified place candidate.
      </p>

      <ol className="mt-5 space-y-0">
        {bridge.steps.map((step, i) => (
          <li key={`${step.kind}-${step.label}`} className="relative flex gap-4 pb-5 last:pb-0">
            {i < bridge.steps.length - 1 && (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-bragi-ink/15"
                aria-hidden
              />
            )}
            <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bragi-navy text-xs font-semibold text-bragi-cream">
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-bragi-navy/40">
                {KIND_LABEL[step.kind]}
              </p>
              <p className="mt-0.5 text-sm font-medium text-bragi-navy">{step.label}</p>
              {step.detail && (
                <p className="mt-0.5 text-xs text-bragi-navy/50">{step.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {!bridge.complete && (
        <p className="mt-3 text-xs text-bragi-navy/45">
          Partial bridge — some hops were omitted because evidence was incomplete.
        </p>
      )}
      {bridge.rankingPath === "bragi_catalogue" && (
        <p className="mt-3 text-xs text-bragi-navy/45">
          Final selection uses Bragi’s evidence-aware catalogue score, informed by Qloo affinities —
          not a claim that Qloo ranked this creator directly.
        </p>
      )}
    </section>
  );
}
