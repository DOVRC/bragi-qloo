"use client";

import { useState, useTransition } from "react";
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

  function discover() {
    setClientError(null);
    if (selected.length === 0) {
      setClientError("Select at least one cultural preference.");
      return;
    }
    const query = buildDiscoverQuery(selected, "Medellín", budgetCop);
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
      } catch {
        setClientError("Network failure reaching the discovery API.");
        setResult(null);
      }
    });
  }

  return (
    <section id="discover" className="workspace-surface scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-bragi-navy/45">Discover</p>
          <h2 className="mt-2 font-display text-3xl text-bragi-navy sm:text-4xl">
            Build your cultural DNA
          </h2>
          <p className="mt-3 text-bragi-navy/65">
            Choose tastes Qloo can resolve, set a Medellín budget, and receive up to three
            evidence-backed local matches. No bookings, no fake availability.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-bragi-ink/10 bg-white/90 p-5 shadow-sm sm:p-7">
            <TasteSelector selected={selected} onChange={setSelected} />

            <label className="mt-8 block max-w-xs space-y-2">
              <span className="text-sm font-medium text-bragi-navy">Budget (COP)</span>
              <input
                type="number"
                min={0}
                step={5000}
                value={budgetCop}
                onChange={(e) => setBudgetCop(Number(e.target.value))}
                className="min-h-11 w-full rounded-xl border border-bragi-ink/10 bg-bragi-cream/40 px-4 text-bragi-navy"
              />
              <span className="block text-xs text-bragi-navy/45">
                Filters catalogue entries with indicative costs — not confirmed tickets.
              </span>
            </label>

            <p className="mt-4 text-sm text-bragi-navy/55">Demo city: Medellín</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={discover}
                className="min-h-11 rounded-full bg-bragi-accent px-6 text-sm font-semibold text-white transition hover:bg-bragi-accent/90 disabled:opacity-60"
              >
                {pending ? "Discovering…" : "Discover in Medellín"}
              </button>
              {result && (
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setClientError(null);
                  }}
                  className="min-h-11 rounded-full border border-bragi-ink/15 px-5 text-sm text-bragi-navy"
                >
                  Reset results
                </button>
              )}
            </div>

            {clientError && (
              <p className="mt-4 border-l-2 border-amber-500 pl-3 text-sm text-amber-900" role="alert">
                {clientError}
              </p>
            )}
            {pending && (
              <p className="mt-4 animate-pulse text-sm text-bragi-navy/55" aria-live="polite">
                Running the discovery agent against Qloo. This can take a few seconds…
              </p>
            )}
          </div>

          <div className="space-y-6">
            {!result && !pending && (
              <div className="rounded-3xl border border-dashed border-bragi-ink/15 bg-white/50 p-6 text-sm text-bragi-navy/60">
                Recommendations and evidence will appear here after you discover.
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-fade-up">
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    result.mode === "live"
                      ? "border-emerald-600/30 bg-emerald-50 text-emerald-950"
                      : "border-amber-500/40 bg-amber-50 text-amber-950"
                  }`}
                  role="status"
                >
                  {result.mode === "live" ? (
                    <>
                      <strong>Live mode.</strong> Results use real Qloo Search/Insights plus
                      Bragi catalogue matching. Affinities are aggregate, not personal proof.
                    </>
                  ) : (
                    <>
                      <strong>Sample-data mode.</strong> Not a live Qloo response.
                    </>
                  )}
                </div>

                <div className="rounded-3xl border border-bragi-ink/10 bg-white p-5">
                  <AgentSteps steps={result.steps} />
                </div>

                {!result.ok && (
                  <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-red-950" role="alert">
                    <p className="font-semibold">{result.error.code}</p>
                    <p className="mt-1 text-sm">{result.error.message}</p>
                    <p className="mt-2 text-xs opacity-80">
                      Live failures do not fall back to simulated Qloo data.
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

                {result.ok && (
                  <div className="rounded-3xl border border-bragi-ink/10 bg-white p-5">
                    <TasteEvidencePanel profile={result.profile} mode={result.mode} />
                  </div>
                )}

                {result.ok && result.recommendations.length === 0 && (
                  <div className="rounded-2xl border border-bragi-ink/15 bg-white p-5 text-sm text-bragi-navy/70">
                    <p className="font-semibold text-bragi-navy">No defensible local matches</p>
                    <p className="mt-2">
                      Qloo evidence was retrieved, but no catalogue entry cleared the evidence
                      threshold for your constraints. Try different signals or raise budget.
                    </p>
                  </div>
                )}

                {result.ok && result.recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-display text-xl text-bragi-navy">
                      Recommended experiences
                    </h3>
                    {result.recommendations.map((rec, i) => (
                      <RecommendationCard key={rec.entry.id} recommendation={rec} rank={i} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
