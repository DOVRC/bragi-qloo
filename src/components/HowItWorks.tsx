const steps = [
  {
    title: "Share cultural signals",
    body: "Select artists, films, genres, or brands that describe your taste.",
  },
  {
    title: "Resolve with Qloo",
    body: "Bragi maps your signals to Qloo entities and retrieves cross-domain affinities.",
  },
  {
    title: "Match Medellín",
    body: "A transparent ranking layer compares Qloo evidence with a curated local catalogue.",
  },
  {
    title: "Explain the why",
    body: "Each recommendation shows what came from Qloo versus Bragi’s catalogue logic.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-bragi-paper/70">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-bragi-navy/45">How it works</p>
        <h2 className="mt-2 max-w-xl font-display text-3xl text-bragi-navy sm:text-4xl">
          Recommendations you can inspect
        </h2>
        <p className="mt-3 max-w-2xl text-bragi-navy/65">
          Bragi is an agentic cultural matcher: intermediate Qloo results decide later steps.
          Scores are Bragi’s internal ranking metric, not Qloo probabilities.
        </p>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-bragi-ink/10 bg-white p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-bragi-accent">
                Step {i + 1}
              </p>
              <h3 className="mt-2 font-display text-xl text-bragi-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bragi-navy/65">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
