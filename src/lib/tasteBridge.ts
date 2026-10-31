import type { DiscoverSuccess, Recommendation } from "@/lib/types";

export type BridgeStepKind =
  | "user_interest"
  | "qloo_resolved"
  | "qloo_affinity"
  | "bragi_match"
  | "portfolio";

export interface TasteBridgeStep {
  kind: BridgeStepKind;
  label: string;
  detail?: string;
}

export interface TasteBridge {
  recommendationId: string;
  rankingPath: Recommendation["rankingPath"];
  steps: TasteBridgeStep[];
  /** True only when every rendered hop has supporting evidence */
  complete: boolean;
}

/**
 * Build an evidence-backed taste→creator bridge from an existing discovery result.
 * Never invents edges: skips hops that lack contribution/evidence support.
 */
export function buildTasteBridge(
  result: DiscoverSuccess,
  recommendation: Recommendation,
): TasteBridge | null {
  const steps: TasteBridgeStep[] = [];

  const userLabels = unique(
    recommendation.contributions
      .filter((c) => c.kind === "user_signal")
      .map((c) => c.label)
      .concat(
        result.profile.signals
          .map((s) => s.raw)
          .filter((raw) =>
            recommendation.evidence.some(
              (e) => e.source === "user_signal" && e.detail.includes(`“${raw}”`),
            ),
          ),
      ),
  );

  const resolvedFromContrib = recommendation.contributions
    .filter((c) => c.kind === "qloo_search")
    .map((c) => ({ label: c.label, id: c.id }));

  const resolvedFromProfile = result.profile.resolvedEntities.filter((e) =>
    recommendation.matchedAffinityIds.includes(e.id),
  );

  const resolvedLabels = unique([
    ...resolvedFromContrib.map((r) => r.label),
    ...resolvedFromProfile.map((e) => e.name),
  ]);

  const affinityRaw: string[] = recommendation.contributions
    .filter(
      (c) =>
        c.kind === "qloo_insights_entity" ||
        c.kind === "qloo_insights_tag" ||
        c.kind === "qloo_native_affinity" ||
        c.kind === "qloo_explainability",
    )
    .map((c) => c.label);

  // Explainability inputs are Qloo evidence, not catalogue invention
  if (recommendation.qlooExplainability?.available) {
    for (const c of recommendation.qlooExplainability.contributions) {
      if (c.entityName) affinityRaw.push(c.entityName);
    }
  }

  const affinityUnique = unique(affinityRaw);

  if (userLabels.length === 0 && resolvedLabels.length === 0 && affinityUnique.length === 0) {
    // Native path may still have affinity without user_signal contributions
    if (recommendation.rankingPath !== "qloo_native" || recommendation.qlooNativeAffinity == null) {
      return null;
    }
  }

  if (userLabels.length > 0) {
    steps.push({
      kind: "user_interest",
      label: userLabels.slice(0, 3).join(" · "),
      detail: "Interest you selected",
    });
  } else if (resolvedLabels.length > 0 || affinityUnique.length > 0) {
    // Fall back: show first profile signal as context only when Search/Insights evidence exists
    const fallback = result.profile.signals.slice(0, 2).map((s) => s.raw);
    if (fallback.length) {
      steps.push({
        kind: "user_interest",
        label: fallback.join(" · "),
        detail: "Interest used as Search / Insights input",
      });
    }
  }

  if (resolvedLabels.length > 0) {
    steps.push({
      kind: "qloo_resolved",
      label: resolvedLabels.slice(0, 3).join(" · "),
      detail: "Qloo Search entity resolution",
    });
  }

  if (affinityUnique.length > 0) {
    steps.push({
      kind: "qloo_affinity",
      label: affinityUnique.slice(0, 4).join(" · "),
      detail:
        recommendation.rankingPath === "qloo_native"
          ? "Qloo Insights candidate evidence"
          : "Qloo Insights affinity or tag",
    });
  } else if (
    recommendation.rankingPath === "qloo_native" &&
    recommendation.qlooNativeAffinity != null
  ) {
    steps.push({
      kind: "qloo_affinity",
      label: `query.affinity ${recommendation.qlooNativeAffinity.toFixed(2)}`,
      detail: "Qloo Insights native candidate score (not a Bragi points total)",
    });
  }

  const hasQlooHop = steps.some((s) => s.kind === "qloo_resolved" || s.kind === "qloo_affinity");
  const hasUserHop = steps.some((s) => s.kind === "user_interest");
  if (!hasUserHop || !hasQlooHop) {
    // Allow incomplete bridges only when Bragi catalogue overlap is explicit
    const hasCatalogueEvidence = recommendation.evidence.some(
      (e) => e.source === "catalogue" || e.source === "user_signal",
    );
    if (!hasCatalogueEvidence && !hasQlooHop) return null;
  }

  steps.push({
    kind: "bragi_match",
    label: recommendation.entry.name,
    detail:
      recommendation.rankingPath === "qloo_native"
        ? "Local catalogue identity linked to a Qloo-ranked place candidate"
        : "Bragi catalogue semantic / metadata overlap (not a Qloo ranking)",
  });

  if (recommendation.entry.publicUrl) {
    steps.push({
      kind: "portfolio",
      label:
        recommendation.entry.kind === "creator"
          ? "Public portfolio / releases"
          : recommendation.entry.kind === "project"
            ? "Project site"
            : "Official site",
      detail: recommendation.entry.publicUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    });
  }

  const complete =
    steps.some((s) => s.kind === "user_interest") &&
    steps.some((s) => s.kind === "qloo_resolved" || s.kind === "qloo_affinity") &&
    steps.some((s) => s.kind === "bragi_match");

  if (!complete && steps.length < 3) return null;

  return {
    recommendationId: recommendation.entry.id,
    rankingPath: recommendation.rankingPath,
    steps,
    complete,
  };
}

/** Prefer the strongest creator/project bridge, else first complete bridge. */
export function selectPrimaryBridge(result: DiscoverSuccess): TasteBridge | null {
  const bridges = result.recommendations
    .map((r) => buildTasteBridge(result, r))
    .filter((b): b is TasteBridge => b != null);

  const creatorFirst = bridges.find((b) => {
    const rec = result.recommendations.find((r) => r.entry.id === b.recommendationId);
    return rec?.entry.kind === "creator" || rec?.entry.kind === "project";
  });
  if (creatorFirst?.complete) return creatorFirst;

  return bridges.find((b) => b.complete) ?? bridges[0] ?? null;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v.trim());
  }
  return out;
}
