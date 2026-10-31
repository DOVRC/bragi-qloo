"use client";

import type { ReactNode } from "react";
import { Clapperboard, Headphones, Link2, Palette, Sparkles } from "lucide-react";
import type { AffinityNode, DiscoveryTrace } from "@/lib/types";

export function AffinityConnections({
  trace,
  activeAffinityId,
  onSelectAffinity,
}: {
  trace: DiscoveryTrace;
  activeAffinityId: string | null;
  onSelectAffinity: (id: string | null) => void;
}) {
  const themes = trace.themeTags.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-bragi-navy/45">
          Your taste connections
        </p>
        <h3 className="mt-1 font-display text-2xl text-bragi-navy">
          What Qloo returned from your interests
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-bragi-navy/60">
          These affinities were retrieved from your combined interests — not invented pairwise
          edges. Select one to highlight matches that actually used it in evidence-backed
          ranking.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <Column
          title="Your interests"
          icon={<Sparkles className="h-4 w-4" aria-hidden />}
        >
          {trace.userSignals.map((s) => (
            <Chip key={s} label={s} tone="ink" />
          ))}
        </Column>

        <Connector />

        <Column
          title="Resolved entities"
          icon={<Link2 className="h-4 w-4" aria-hidden />}
        >
          {trace.resolvedEntities.length === 0 ? (
            <p className="text-sm text-bragi-navy/50">None resolved this run.</p>
          ) : (
            trace.resolvedEntities.map((n) => (
              <EntityCard key={n.id} node={n} active={false} onClick={() => undefined} />
            ))
          )}
        </Column>

        <Connector />

        <Column
          title="Discovered affinities"
          icon={<Headphones className="h-4 w-4" aria-hidden />}
        >
          {trace.discoveredAffinities.length === 0 ? (
            <p className="text-sm text-bragi-navy/50">
              No new Insights affinities beyond your inputs.
            </p>
          ) : (
            trace.discoveredAffinities.map((n) => (
              <EntityCard
                key={n.id}
                node={n}
                active={activeAffinityId === n.id}
                onClick={() =>
                  onSelectAffinity(activeAffinityId === n.id ? null : n.id)
                }
              />
            ))
          )}
        </Column>
      </div>

      {themes.length > 0 && (
        <div className="rounded-2xl border border-bragi-ink/8 bg-bragi-paper/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-bragi-accent">
            Cultural themes
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {themes.map((t) => (
              <Chip key={t} label={t} tone="mist" />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-bragi-navy/45">
        Coverage: {trace.evidenceCoverage.searchEntities} Search ·{" "}
        {trace.evidenceCoverage.insightEntities} Insights entities ·{" "}
        {trace.evidenceCoverage.insightTags} tags ·{" "}
        {trace.evidenceCoverage.recommendationsWithInsights} Insights-backed
        {trace.evidenceCoverage.recommendationsWithInsights === 1 ? " place" : " places"}
      </p>
    </div>
  );
}

function Column({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[1.35rem] border border-bragi-ink/8 bg-white/90 p-4">
      <div className="mb-3 flex items-center gap-2 text-bragi-navy">
        <span className="text-bragi-accent">{icon}</span>
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Connector() {
  return (
    <div
      className="hidden items-center justify-center text-bragi-mist lg:flex"
      aria-hidden
    >
      <div className="h-px w-6 bg-bragi-accent/40" />
      <span className="mx-1 text-bragi-accent">↓</span>
      <div className="h-px w-6 bg-bragi-accent/40" />
    </div>
  );
}

function EntityCard({
  node,
  active,
  onClick,
}: {
  node: AffinityNode;
  active: boolean;
  onClick: () => void;
}) {
  const clickable = node.source === "qloo_insights";
  const Icon =
    node.categoryHint === "film"
      ? Clapperboard
      : node.categoryHint === "brand"
        ? Palette
        : Headphones;

  const body = (
    <>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-bragi-accent" aria-hidden />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-bragi-navy">{node.name}</span>
        <span className="block text-[11px] uppercase tracking-wide text-bragi-navy/40">
          {node.source === "qloo_search"
            ? "Search"
            : node.source === "qloo_tags"
              ? "Tags"
              : "Insights"}
          {node.kind === "inferred" ? " · discovered" : " · direct"}
        </span>
      </span>
    </>
  );

  if (!clickable) {
    return (
      <div className="flex gap-2 rounded-xl border border-bragi-ink/8 bg-bragi-cream/40 px-3 py-2">
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full gap-2 rounded-xl border px-3 py-2 text-left transition duration-200 ease-out ${
        active
          ? "border-bragi-accent bg-bragi-accent/10 shadow-sm"
          : "border-bragi-ink/8 bg-bragi-cream/40 hover:border-bragi-accent/40"
      }`}
    >
      {body}
    </button>
  );
}

function Chip({ label, tone }: { label: string; tone: "ink" | "mist" }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-sm ${
        tone === "ink"
          ? "bg-bragi-ink text-bragi-mist"
          : "bg-bragi-mist/50 text-bragi-navy"
      }`}
    >
      {label}
    </span>
  );
}
