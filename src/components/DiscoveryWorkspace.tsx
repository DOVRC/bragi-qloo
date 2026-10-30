"use client";

import { useRef, useState, useTransition } from "react";
import type { DiscoverResponse } from "@/lib/types";
import { buildDiscoverQuery, PRESET_A } from "@/lib/presets";
import { TasteSelector } from "./TasteSelector";
import { AgentSteps } from "./AgentSteps";
import { TasteEvidencePanel } from "./TasteEvidencePanel";
import { RecommendationCard } from "./RecommendationCard";

export function DiscoveryWorkspace() {
  const [selected, setSelected] = useState<string[]>([...PRESET_A]);
  const [budgetCop, setBudgetCop] = useState(100_000);
  const [result, setResult] = useState<DiscoverResponse | null>(null);
  const [pending, startTransition] = useTransition();
  const [clientError, setClientError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  function discover() {
    setClientError(null);
    if (selected.length === 0) {
      setClientError("Select at least one cultural interest to continue.");
      return;
    }
    if (pending || inFlight.current) return;

    const query = buildDiscoverQuery(selected, "Medellín", budgetCop);
    inFlight.current = true;
    startTransition(async () => {
      try {
        const res = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            signals: selected,
            city: "Medellín",
            budgetCop,
          }),
        });
        const data = (await res.json()) as DiscoverResponse;
        setResult(data);
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } catch {
        setClientError("Network failure reaching the discovery API. Your tastes were kept.");
      } finally {
        inFlight.current = false;
      }
    });
  }

  return (
    <section id="discover" className="workspace-surface scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-bragi-navy/45">
            Discover
          </p>
          <h2 className="mt-2 font-display text-3xl text-bragi-navy sm:text-4xl">
            What inspires you?
          </h2>
          <p className="mt-3 text-bragi-navy/65">
            Choose a few cultural interests, set a Medellín budget, and we&apos;ll return up
            to three evidence-backed local matches — no bookings, no invented availability.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[1.75rem] border border-bragi-ink/8 bg-white/95 p-5 shadow-[0_12px_40px_rgba(16,24,40,0.05)] sm:p-7">
            <TasteSelector selected={selected} onChange={setSelected} />

            <label className="mt-8 block max-w-xs space-y-2">
              <span className="text-sm font-medium text-bragi-navy">Budget (COP)</span>
              <input
                type="number"
                min={0}
                step={5000}
                value={budgetCop}
                onChange={(e) => setBudgetCop(Number(e.target.value))}
                className="min-h-11 w-full rounded-2xl border border-bragi-ink/10 bg-bragi-cream/50 px-4 text-bragi-navy outline-none transition duration-200 ease-out focus:border-bragi-accent/40"
              />
              <span className="block text-xs text-bragi-navy/45">
                Filters indicative catalogue costs — not confirmed tickets.
              </span>
            </label>

            <p className="mt-4 text-sm text-bragi-navy/50">City for this demo: Medellín</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={discover}
                className="min-h-11 rounded-full bg-bragi-accent px-6 text-sm font-semibold text-white transition duration-200 ease-out hover:bg-bragi-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Finding matches…" : "Find my matches"}
              </button>
              {result && (
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setClientError(null);
                  }}
                  className="min-h-11 rounded-full border border-bragi-ink/15 px-5 text-sm text-bragi-navy transition duration-200 ease-out hover:bg-bragi-paper"
                >
                  Start over
                </button>
              )}
            </div>

            {clientError && (
              <p
                className="mt-4 border-l-2 border-amber-500 pl-3 text-sm text-amber-900"
                role="alert"
              >
                {clientError}
              </p>
            )}
          </div>

          <div ref={resultsRef} className="min-h-[280px] scroll-mt-28 space-y-5">
            {!result && !pending && (
              <div className="flex h-full min-h-[280px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-bragi-ink/8 bg-gradient-to-br from-bragi-paper via-white to-bragi-cream p-6 sm:p-8">
                <div>
                  <p className="font-display text-2xl text-bragi-navy">Your matches appear here</p>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-bragi-navy/60">
                    Pick tastes on the left, then find matches. Recommendations come first —
                    deeper Qloo evidence stays a tap away.
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-3" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-bragi-navy/90 via-bragi-accent/70 to-bragi-mist/80 opacity-80"
                      style={{ transform: `translateY(${i * 6}px)` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {pending && (
              <div className="space-y-4" aria-live="polite" aria-busy="true">
                <p className="text-sm text-bragi-navy/60">
                  Looking for Medellín matches from your tastes. This can take a few seconds —
                  we only show progress we can verify.
                </p>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-[1.5rem] border border-bragi-ink/8 bg-white"
                  >
                    <div className="h-28 animate-pulse bg-gradient-to-r from-bragi-paper via-bragi-mist/40 to-bragi-paper" />
                    <div className="space-y-3 p-5">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-bragi-paper" />
                      <div className="h-4 w-full animate-pulse rounded bg-bragi-paper/80" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-bragi-paper/70" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result && !pending && (
              <div className="space-y-5 animate-fade-up">
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    result.mode === "live"
                      ? "border-emerald-600/25 bg-emerald-50 text-emerald-950"
                      : "border-amber-500/35 bg-amber-50 text-amber-950"
                  }`}
                  role="status"
                >
                  {result.mode === "live" ? (
                    <>
                      <strong>Live taste graph.</strong> Matches use real Qloo Search/Insights
                      plus Bragi&apos;s local catalogue. Affinities are aggregate cultural
                      signals, not personal proof.
                    </>
                  ) : (
                    <>
                      <strong>Sample-data mode.</strong> Not a live Qloo response.
                    </>
                  )}
                </div>

                {!result.ok && (
                  <div
                    className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-red-950"
                    role="alert"
                  >
                    <p className="font-semibold">{result.error.code}</p>
                    <p className="mt-1 text-sm">{result.error.message}</p>
                    <p className="mt-2 text-xs opacity-80">
                      Live failures do not fall back to simulated Qloo data. Adjust tastes and
                      try again.
                    </p>
                  </div>
                )}

                {result.ok && result.warnings.length > 0 && (
                  <ul className="space-y-1 border-l-2 border-bragi-ink/20 pl-4 text-sm text-bragi-navy/65">
                    {result.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}

                {result.ok && result.recommendations.length === 0 && (
                  <div className="rounded-[1.5rem] border border-bragi-ink/10 bg-white p-6 text-sm text-bragi-navy/70">
                    <p className="font-display text-xl text-bragi-navy">No clear local matches</p>
                    <p className="mt-2">
                      We retrieved taste evidence, but nothing in the catalogue cleared the
                      evidence threshold for your constraints. Try different interests or raise
                      the budget.
                    </p>
                  </div>
                )}

                {result.ok && result.recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-display text-2xl text-bragi-navy">
                      Recommended for you
                    </h3>
                    {result.recommendations.map((rec, i) => (
                      <RecommendationCard key={rec.entry.id} recommendation={rec} rank={i} />
                    ))}
                  </div>
                )}

                {result.ok && (
                  <div className="rounded-[1.5rem] border border-bragi-ink/8 bg-white/90 p-5">
                    <TasteEvidencePanel profile={result.profile} mode={result.mode} />
                  </div>
                )}

                <div className="rounded-[1.5rem] border border-bragi-ink/8 bg-white/80 p-5">
                  <AgentSteps steps={result.steps} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
