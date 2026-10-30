"use client";

import { useState, useTransition } from "react";
import type { DiscoverResponse } from "@/lib/types";
import { AgentSteps } from "./AgentSteps";
import { RecommendationList } from "./RecommendationList";
import { TasteEvidencePanel } from "./TasteEvidencePanel";

const EXAMPLE_A =
  "I love Radiohead, Studio Ghibli, and experimental jazz. Help me find a cultural experience in Medellín with a budget of COP 100,000.";

const EXAMPLE_B =
  "I love reggaeton, urban fashion, and latin dance. Help me find a cultural experience in Medellín with a budget of COP 100,000.";

export function DiscoveryForm() {
  const [query, setQuery] = useState(EXAMPLE_A);
  const [budgetCop, setBudgetCop] = useState(100_000);
  const [result, setResult] = useState<DiscoverResponse | null>(null);
  const [pending, startTransition] = useTransition();
  const [clientError, setClientError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setClientError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, budgetCop, city: "Medellín" }),
        });
        const data = (await res.json()) as DiscoverResponse;
        setResult(data);
      } catch {
        setClientError("Could not reach the discovery API. Is the dev server running?");
        setResult(null);
      }
    });
  }

  return (
    <div className="space-y-10">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setQuery(EXAMPLE_A)}
            className="border border-bragi-mist/25 px-3 py-1.5 text-xs uppercase tracking-wider text-bragi-mist/70 hover:border-bragi-mist/50 hover:text-bragi-mist"
          >
            Profile A · experimental
          </button>
          <button
            type="button"
            onClick={() => setQuery(EXAMPLE_B)}
            className="border border-bragi-mist/25 px-3 py-1.5 text-xs uppercase tracking-wider text-bragi-mist/70 hover:border-bragi-mist/50 hover:text-bragi-mist"
          >
            Profile B · urban/latin
          </button>
        </div>

        <label className="block space-y-2">
          <span className="font-display text-sm tracking-wide text-bragi-mist/80">
            Your cultural signals
          </span>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-sm border border-bragi-mist/20 bg-bragi-ink/60 px-4 py-3 font-sans text-base text-bragi-mist outline-none ring-bragi-mist/30 placeholder:text-bragi-mist/40 focus:ring-2"
            placeholder="Artists, films, genres you love…"
            required
          />
        </label>

        <label className="block max-w-xs space-y-2">
          <span className="font-display text-sm tracking-wide text-bragi-mist/80">
            Budget (COP)
          </span>
          <input
            type="number"
            min={0}
            step={5000}
            value={budgetCop}
            onChange={(e) => setBudgetCop(Number(e.target.value))}
            className="w-full rounded-sm border border-bragi-mist/20 bg-bragi-ink/60 px-4 py-3 font-sans text-bragi-mist outline-none focus:ring-2 focus:ring-bragi-mist/30"
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm bg-bragi-mist px-8 py-3 font-display text-sm font-semibold tracking-wide text-bragi-ink transition hover:bg-white disabled:opacity-60"
          >
            {pending ? "Discovering…" : "Discover in Medellín"}
          </button>
          <p className="text-xs text-bragi-mist/45">
            Location fixed to Medellín for this demo.
          </p>
        </div>
      </form>

      {clientError && (
        <p className="border-l-2 border-amber-400/80 pl-4 text-amber-100">{clientError}</p>
      )}

      {pending && !result && (
        <p className="animate-pulse text-sm text-bragi-mist/60">
          Running discovery agent steps against Qloo…
        </p>
      )}

      {result && (
        <div className="space-y-8 animate-fade-up">
          <div
            className={`border px-4 py-3 text-sm ${
              result.mode === "live"
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                : "border-amber-400/50 bg-amber-400/10 text-amber-100"
            }`}
            role="status"
          >
            {result.mode === "live" ? (
              <>
                <strong>Live mode</strong> — recommendations use real Qloo Search/Insights
                evidence plus Bragi catalogue matching. Qloo reports aggregate affinities, not
                your personal identity.
              </>
            ) : (
              <>
                Sample-data mode — these results are for UI development and are{" "}
                <strong>not</strong> live Qloo API responses.
              </>
            )}
          </div>

          <AgentSteps steps={result.steps} />

          {!result.ok && (
            <div className="border border-red-400/40 bg-red-500/10 px-4 py-3 text-red-100">
              <p className="font-display font-semibold">{result.error.code}</p>
              <p className="mt-1 text-sm opacity-90">{result.error.message}</p>
              <p className="mt-2 text-xs opacity-70">
                The app does not silently fall back to sample data when Qloo fails.
              </p>
            </div>
          )}

          {result.ok && result.warnings.length > 0 && (
            <ul className="space-y-1 border-l-2 border-bragi-mist/30 pl-4 text-sm text-bragi-mist/70">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          {result.ok && <TasteEvidencePanel profile={result.profile} mode={result.mode} />}

          {result.ok && (
            <RecommendationList recommendations={result.recommendations} mode={result.mode} />
          )}
        </div>
      )}
    </div>
  );
}
