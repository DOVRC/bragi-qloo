"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Compass,
  MapPin,
  Network,
  SlidersHorizontal,
} from "lucide-react";
import type {
  DiscoverResponse,
  DiscoverSuccess,
  DiscoveryIntent,
  Recommendation,
} from "@/lib/types";
import { buildDiscoverQuery, PRESET_A, PRESET_B } from "@/lib/presets";
import { TasteSelector } from "./TasteSelector";
import { AffinityConnections } from "./AffinityConnections";
import { RecommendationCard } from "./RecommendationCard";
import { TasteEvidencePanel } from "./TasteEvidencePanel";
import { AgentSteps } from "./AgentSteps";
import { TasteDna } from "./TasteDna";
import { NativeAffinityCompare } from "./NativeAffinityCompare";
import {
  moreLikeSignals,
  pickNextSurpriseAffinity,
  uniquePreserve,
} from "@/lib/tasteFeedback";

type Step = 1 | 2 | 3 | 4;

const INTENT_OPTIONS: {
  id: DiscoveryIntent;
  label: string;
  hint: string;
}[] = [
  {
    id: "creators",
    label: "Creators",
    hint: "Independent artists, collectives, and cultural projects",
  },
  {
    id: "places",
    label: "Places",
    hint: "Venues, museums, and public cultural spaces",
  },
  {
    id: "mixed",
    label: "Surprise me",
    hint: "A balanced mix of creators and places",
  },
];

export function TasteJourney() {
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<string[]>([...PRESET_A]);
  const [budgetCop, setBudgetCop] = useState(100_000);
  const [intent, setIntent] = useState<DiscoveryIntent>("mixed");
  const [result, setResult] = useState<DiscoverSuccess | null>(null);
  const [previous, setPrevious] = useState<DiscoverSuccess | null>(null);
  const [pending, startTransition] = useTransition();
  const [clientError, setClientError] = useState<string | null>(null);
  const [activeAffinityId, setActiveAffinityId] = useState<string | null>(null);
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [excludeEntryIds, setExcludeEntryIds] = useState<string[]>([]);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);
  const [surpriseIndex, setSurpriseIndex] = useState(0);
  const [usedSurpriseNames, setUsedSurpriseNames] = useState<string[]>([]);
  const inFlight = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const comparison = useMemo(() => {
    if (!result || !previous) return null;
    const prevAff = new Set(previous.trace.discoveredAffinities.map((a) => a.name));
    const nextAff = new Set(result.trace.discoveredAffinities.map((a) => a.name));
    const added = [...nextAff].filter((n) => !prevAff.has(n));
    const removed = [...prevAff].filter((n) => !nextAff.has(n));
    const prevPlaces = previous.recommendations.map((r) => r.entry.id).join("|");
    const nextPlaces = result.recommendations.map((r) => r.entry.id).join("|");
    return {
      added,
      removed,
      placesChanged: prevPlaces !== nextPlaces,
      prevSignals: previous.trace.userSignals,
      nextSignals: result.trace.userSignals,
    };
  }, [result, previous]);

  function runDiscovery(overrides?: {
    signals?: string[];
    intent?: DiscoveryIntent;
    excludeEntryIds?: string[];
    prioritySignals?: string[];
    jumpToStep?: Step;
    note?: string;
  }) {
    setClientError(null);
    const nextSignals = overrides?.signals ?? selected;
    const nextIntent = overrides?.intent ?? intent;
    const nextExclude = overrides?.excludeEntryIds ?? excludeEntryIds;
    const nextPriority = overrides?.prioritySignals;
    if (nextSignals.length === 0) {
      setClientError("Select at least one cultural interest to continue.");
      return;
    }
    if (pending || inFlight.current) return;

    if (overrides?.signals) setSelected(nextSignals);
    if (overrides?.intent) setIntent(nextIntent);
    if (overrides?.excludeEntryIds) setExcludeEntryIds(nextExclude);
    if (overrides?.note) setFeedbackNote(overrides.note);
    else if (!overrides) setFeedbackNote(null);

    const query = buildDiscoverQuery(nextSignals, "Medellín", budgetCop);
    inFlight.current = true;
    startTransition(async () => {
      try {
        const res = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            signals: nextSignals,
            city: "Medellín",
            budgetCop,
            intent: nextIntent,
            excludeEntryIds: nextExclude.length ? nextExclude : undefined,
            prioritySignals: nextPriority?.length ? nextPriority : undefined,
          }),
        });
        const data = (await res.json()) as DiscoverResponse;
        if (!data.ok) {
          setClientError(data.error.message);
          setResult(null);
          return;
        }
        setPrevious(result);
        setResult(data);
        setActiveAffinityId(null);
        setSelectedRecId(data.recommendations[0]?.entry.id ?? null);
        setStep(overrides?.jumpToStep ?? 2);
        requestAnimationFrame(() => {
          panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } catch {
        setClientError("Network failure reaching the discovery API. Your tastes were kept.");
      } finally {
        inFlight.current = false;
      }
    });
  }

  function handleMoreLikeThis(rec: Recommendation) {
    const { signals: next, priority } = moreLikeSignals(rec, selected);
    runDiscovery({
      signals: next,
      prioritySignals: priority,
      jumpToStep: 3,
      note: `More like “${rec.entry.name}” — prioritized ${priority.slice(0, 3).join(", ") || "related evidence"} for Qloo Search/Insights within the resolve budget.`,
    });
  }

  function handleNotMyStyle(rec: Recommendation) {
    const nextExclude = [...new Set([...excludeEntryIds, rec.entry.id])];
    runDiscovery({
      excludeEntryIds: nextExclude,
      jumpToStep: 3,
      note: `Excluded “${rec.entry.name}” from this session — re-ranked without inventing replacements.`,
    });
  }

  function handleSurpriseAgain() {
    if (!result) {
      setIntent("mixed");
      runDiscovery({ intent: "mixed" });
      return;
    }
    const affinities = result.trace.discoveredAffinities;
    const surprise = pickNextSurpriseAffinity(affinities, usedSurpriseNames, surpriseIndex);
    if (surprise) {
      setSurpriseIndex((i) => i + 1);
      setUsedSurpriseNames((prev) =>
        uniquePreserve([...prev, surprise.name]).slice(-12),
      );
    }
    const nextSignals = surprise
      ? uniquePreserve([surprise.name, ...selected])
      : selected;
    runDiscovery({
      signals: nextSignals,
      prioritySignals: surprise ? [surprise.name] : undefined,
      intent: "mixed",
      jumpToStep: 3,
      note: surprise
        ? `Surprise path — prioritized Insights affinity “${surprise.name}” for Qloo resolution (rotated, not always the first).`
        : "Surprise path — mixed creators + places with your current interests.",
    });
  }

  function resetJourney() {
    setStep(1);
    setResult(null);
    setPrevious(null);
    setClientError(null);
    setActiveAffinityId(null);
    setSelectedRecId(null);
    setSelected([...PRESET_A]);
    setIntent("mixed");
    setExcludeEntryIds([]);
    setFeedbackNote(null);
    setSurpriseIndex(0);
    setUsedSurpriseNames([]);
  }

  const focusedRec = useMemo(() => {
    if (!result) return null;
    return (
      result.recommendations.find((r) => r.entry.id === selectedRecId) ??
      result.recommendations[0] ??
      null
    );
  }, [result, selectedRecId]);

  const whyHeading = useMemo(() => {
    const kind = focusedRec?.entry.kind;
    if (kind === "creator") return "Why this creator fits your taste";
    if (kind === "project") return "Why this creative space fits your taste";
    return "Why this place fits your taste";
  }, [focusedRec]);

  const highlightedRecIds = useMemo(() => {
    if (!result || !activeAffinityId) return new Set<string>();
    return new Set(
      result.recommendations
        .filter((r) => r.matchedAffinityIds.includes(activeAffinityId))
        .map((r) => r.entry.id),
    );
  }, [result, activeAffinityId]);

  return (
    <section id="discover" className="workspace-surface scroll-mt-24" ref={panelRef}>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-bragi-navy/45">
            Taste journey
          </p>
          <h2 className="mt-2 font-display text-3xl text-bragi-navy sm:text-4xl">
            Discover how your tastes connect to Medellín
          </h2>
          <p className="mt-3 text-bragi-navy/65">
            Choose interests, explore affinities returned by Qloo, then see where they lead —
            with evidence you can inspect.
          </p>
        </div>

        <Stepper step={step} hasResult={Boolean(result)} onJump={setStep} />

        {selected.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-bragi-navy/40">
              Your world
            </span>
            {selected.map((s) => (
              <span
                key={s}
                className="rounded-full bg-bragi-ink px-3 py-1 text-xs text-bragi-mist"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-bragi-ink/8 bg-white/95 p-5 shadow-[0_12px_40px_rgba(16,24,40,0.05)] sm:p-7">
              <div className="mb-5 flex items-center gap-2 text-bragi-navy">
                <Compass className="h-5 w-5 text-bragi-accent" aria-hidden />
                <h3 className="font-display text-xl">What inspires you?</h3>
              </div>
              <TasteSelector selected={selected} onChange={setSelected} />

              <fieldset className="mt-8">
                <legend className="text-sm font-medium text-bragi-navy">
                  What do you want to discover?
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {INTENT_OPTIONS.map((option) => {
                    const active = intent === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setIntent(option.id)}
                        className={`rounded-2xl border px-3 py-3 text-left transition duration-200 ease-out ${
                          active
                            ? "border-bragi-accent bg-bragi-accent/10 shadow-[0_8px_24px_rgba(75,98,193,0.12)]"
                            : "border-bragi-ink/10 bg-bragi-cream/40 hover:border-bragi-accent/35"
                        }`}
                      >
                        <span className="block font-display text-lg text-bragi-navy">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-bragi-navy/55">
                          {option.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

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
              </label>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runDiscovery()}
                  className="min-h-11 rounded-full bg-bragi-accent px-6 text-sm font-semibold text-white transition duration-200 ease-out hover:bg-bragi-accent/90 disabled:opacity-60"
                >
                  {pending ? "Exploring connections…" : "Explore my connections"}
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="min-h-11 rounded-full border border-bragi-ink/15 px-5 text-sm text-bragi-navy"
                  >
                    Back to last results
                  </button>
                )}
              </div>
              {clientError && (
                <p className="mt-4 border-l-2 border-amber-500 pl-3 text-sm text-amber-900" role="alert">
                  {clientError}
                </p>
              )}
            </div>

            <aside className="rounded-[1.75rem] border border-bragi-ink/8 bg-gradient-to-br from-bragi-paper via-white to-bragi-cream p-6 sm:p-8">
              <p className="font-display text-2xl text-bragi-navy">Example journeys</p>
              <p className="mt-2 text-sm text-bragi-navy/60">
                Test inputs — not guaranteed result sets.
              </p>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setSelected([...PRESET_A])}
                  className="w-full rounded-2xl border border-bragi-ink/10 bg-white px-4 py-3 text-left transition hover:border-bragi-accent/40"
                >
                  <span className="block text-sm font-semibold text-bragi-navy">
                    Art-house explorer
                  </span>
                  <span className="mt-1 block text-xs text-bragi-navy/55">
                    Radiohead · Studio Ghibli · experimental jazz
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelected([...PRESET_B])}
                  className="w-full rounded-2xl border border-bragi-ink/10 bg-white px-4 py-3 text-left transition hover:border-bragi-accent/40"
                >
                  <span className="block text-sm font-semibold text-bragi-navy">
                    Urban culture explorer
                  </span>
                  <span className="mt-1 block text-xs text-bragi-navy/55">
                    Reggaeton · urban fashion · Latin dance
                  </span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {pending && (
          <div className="mt-8 space-y-3" aria-live="polite" aria-busy="true">
            <p className="text-sm text-bragi-navy/60">
              Resolving entities and retrieving affinities. We only show progress we can verify —
              this can take a few seconds.
            </p>
            <div className="h-32 animate-pulse rounded-[1.5rem] bg-gradient-to-r from-bragi-paper via-bragi-mist/40 to-bragi-paper" />
          </div>
        )}

        {result && !pending && step >= 2 && (
          <div className="mt-8 space-y-8">
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
                  <strong>Live Qloo response.</strong> Affinities below come from Search / Tags /
                  Insights. Aggregate cultural signals — not personal proof.
                </>
              ) : (
                <>
                  <strong>Sample-data mode.</strong> Not a live Qloo response.
                </>
              )}
            </div>

            {comparison && (
              <div className="rounded-2xl border border-bragi-ink/10 bg-white p-4 text-sm text-bragi-navy/70">
                <p className="font-semibold text-bragi-navy">Compared with your previous run</p>
                <p className="mt-1">
                  Before: {comparison.prevSignals.join(", ") || "—"} → Now:{" "}
                  {comparison.nextSignals.join(", ")}
                </p>
                <p className="mt-1">
                  Affinities added: {comparison.added.slice(0, 5).join(", ") || "none"} · removed:{" "}
                  {comparison.removed.slice(0, 5).join(", ") || "none"} · places{" "}
                  {comparison.placesChanged ? "changed" : "unchanged"}
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="rounded-[1.75rem] border border-bragi-ink/8 bg-white/95 p-5 sm:p-7">
                <div className="mb-4 flex items-center gap-2">
                  <Network className="h-5 w-5 text-bragi-accent" aria-hidden />
                  <h3 className="font-display text-xl text-bragi-navy">
                    Discover unexpected connections
                  </h3>
                </div>
                <AffinityConnections
                  trace={result.trace}
                  activeAffinityId={activeAffinityId}
                  onSelectAffinity={setActiveAffinityId}
                />
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="min-h-11 rounded-full bg-bragi-accent px-5 text-sm font-semibold text-white"
                  >
                    See Medellín matches
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-bragi-ink/15 px-5 text-sm text-bragi-navy"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Refine interests
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-bragi-navy">
                      <MapPin className="h-5 w-5 text-bragi-accent" aria-hidden />
                      <h3 className="font-display text-2xl">Where your tastes could take you</h3>
                    </div>
                    <p className="mt-1 text-sm text-bragi-navy/60">
                      Curated Medellín matches — creators and cultural spaces with evidence. Not
                      confirmed tickets or live event inventories.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-sm font-semibold text-bragi-accent hover:underline"
                  >
                    ← Taste connections
                  </button>
                </div>

                {feedbackNote && (
                  <p className="rounded-2xl border border-bragi-accent/25 bg-bragi-accent/5 px-4 py-3 text-sm text-bragi-navy/75">
                    {feedbackNote}
                  </p>
                )}

                {result.warnings.length > 0 && (
                  <ul className="space-y-1 border-l-2 border-bragi-ink/20 pl-4 text-sm text-bragi-navy/65">
                    {result.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}

                <TasteDna result={result} />
                <NativeAffinityCompare recommendations={result.recommendations} />

                {result.recommendations.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-bragi-ink/10 bg-white p-6 text-sm text-bragi-navy/70">
                    <p className="font-display text-xl text-bragi-navy">No clear local matches</p>
                    <p className="mt-2">
                      Taste evidence was retrieved, but nothing cleared the evidence threshold for
                      this intent. Bragi does not invent demonstration profiles in live mode —
                      refine interests, switch intent, or raise budget.
                    </p>
                  </div>
                ) : (
                  result.recommendations.map((rec, i) => (
                    <div key={rec.entry.id}>
                      <button
                        type="button"
                        className="mb-2 text-xs font-semibold text-bragi-accent hover:underline"
                        onClick={() => {
                          setSelectedRecId(rec.entry.id);
                          setStep(4);
                        }}
                      >
                        Open connection story →
                      </button>
                      <RecommendationCard
                        recommendation={rec}
                        rank={i}
                        highlighted={highlightedRecIds.has(rec.entry.id)}
                        onMoreLikeThis={handleMoreLikeThis}
                        onNotMyStyle={handleNotMyStyle}
                      />
                    </div>
                  ))
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={handleSurpriseAgain}
                    className="min-h-11 rounded-full bg-bragi-navy px-5 text-sm font-semibold text-bragi-cream disabled:opacity-60"
                  >
                    Surprise me again
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-bragi-ink/15 px-5 text-sm text-bragi-navy"
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden />
                    Change interests &amp; explore again
                  </button>
                  <button
                    type="button"
                    onClick={resetJourney}
                    className="min-h-11 rounded-full px-5 text-sm text-bragi-navy/55 underline-offset-2 hover:underline"
                  >
                    Reset journey
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-bragi-accent hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  All recommendations
                </button>
                <h3 className="font-display text-2xl text-bragi-navy">{whyHeading}</h3>
                {(selectedRecId
                  ? result.recommendations.filter((r) => r.entry.id === selectedRecId)
                  : result.recommendations.slice(0, 1)
                ).map((rec, i) => (
                  <RecommendationCard key={rec.entry.id} recommendation={rec} rank={i} />
                ))}

                <div className="rounded-[1.5rem] border border-bragi-ink/8 bg-white/90 p-5">
                  <TasteEvidencePanel profile={result.profile} mode={result.mode} />
                </div>
                <div className="rounded-[1.5rem] border border-bragi-ink/8 bg-white/80 p-5">
                  <AgentSteps steps={result.steps} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Stepper({
  step,
  hasResult,
  onJump,
}: {
  step: Step;
  hasResult: boolean;
  onJump: (s: Step) => void;
}) {
  const items: { id: Step; label: string }[] = [
    { id: 1, label: "Interests" },
    { id: 2, label: "Connections" },
    { id: 3, label: "Medellín" },
    { id: 4, label: "Why" },
  ];
  return (
    <ol className="mt-8 flex flex-wrap gap-2" aria-label="Journey steps">
      {items.map((item) => {
        const enabled = item.id === 1 || hasResult;
        const active = step === item.id;
        return (
          <li key={item.id}>
            <button
              type="button"
              disabled={!enabled}
              onClick={() => enabled && onJump(item.id)}
              className={`min-h-10 rounded-full px-4 text-sm transition duration-200 ease-out ${
                active
                  ? "bg-bragi-navy text-bragi-cream"
                  : enabled
                    ? "bg-white text-bragi-navy ring-1 ring-bragi-ink/10 hover:ring-bragi-accent/40"
                    : "cursor-not-allowed bg-bragi-paper/50 text-bragi-navy/35"
              }`}
            >
              {item.id}. {item.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
