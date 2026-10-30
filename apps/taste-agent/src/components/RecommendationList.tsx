import type { Recommendation } from "@/lib/types";

export function RecommendationList({
  recommendations,
  mode,
}: {
  recommendations: Recommendation[];
  mode: "live" | "sample";
}) {
  if (recommendations.length === 0) {
    return (
      <section aria-label="Recommendations" className="space-y-3 border-t border-bragi-mist/15 pt-6">
        <h2 className="font-display text-lg text-bragi-mist">Recommended experiences</h2>
        <div className="border border-bragi-mist/20 bg-bragi-ink/40 px-4 py-5 text-sm text-bragi-mist/70">
          <p className="font-medium text-bragi-mist">No defensible local matches</p>
          <p className="mt-2">
            Qloo evidence was retrieved{mode === "live" ? "" : " (sample)"} but nothing in the
            Medellín catalogue scored above the evidence threshold for your constraints. We do
            not invent recommendations. Try different signals, raise your budget, or broaden
            genres.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Recommendations" className="space-y-6">
      <h2 className="font-display text-lg text-bragi-mist">Recommended experiences</h2>
      <ul className="space-y-8">
        {recommendations.map((rec, i) => (
          <li
            key={rec.entry.id}
            className="animate-fade-up border-t border-bragi-mist/15 pt-6"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-2xl text-bragi-mist">{rec.entry.name}</h3>
              <span className="text-xs uppercase tracking-widest text-bragi-mist/50">
                Score {rec.score.toFixed(1)} · {rec.entry.category.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-bragi-mist/60">
              {rec.entry.neighborhood}, {rec.entry.city}
              {rec.entry.typicalCostCop != null &&
                ` · ~COP ${rec.entry.typicalCostCop.toLocaleString("es-CO")}`}
            </p>
            {rec.entry.provenance === "demonstration" && (
              <p className="mt-2 inline-block border border-amber-400/40 px-2 py-0.5 text-xs text-amber-100">
                Demonstration catalogue entry
              </p>
            )}
            <p className="mt-3 max-w-2xl text-bragi-mist/85">{rec.explanation}</p>
            <p className="mt-2 max-w-2xl text-sm text-bragi-mist/55">{rec.entry.summary}</p>

            <div className="mt-4 space-y-1">
              <p className="text-xs uppercase tracking-wider text-bragi-mist/45">
                Evidence (Qloo vs catalogue)
              </p>
              <ul className="space-y-1 text-sm text-bragi-mist/65">
                {rec.evidence.slice(0, 5).map((ev, idx) => (
                  <li key={`${rec.entry.id}-ev-${idx}`}>
                    <span className="text-bragi-mist/40">[{ev.source}]</span> {ev.detail}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-sm text-bragi-mist/80">
              <span className="font-medium text-bragi-mist">Next step:</span>{" "}
              {rec.entry.actionHint}
              {rec.entry.publicUrl && (
                <>
                  {" "}
                  <a
                    href={rec.entry.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-bragi-mist/40 underline-offset-4 hover:decoration-bragi-mist"
                  >
                    Official site
                  </a>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-sm text-bragi-mist/50">
        Refine: {recommendations[0]?.refinementSuggestions.join(" · ")}
      </p>
    </section>
  );
}
