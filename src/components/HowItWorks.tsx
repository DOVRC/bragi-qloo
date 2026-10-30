const steps = [
  {
    title: "Share what inspires you",
    body: "Select artists, films, genres, or moods that feel like you.",
  },
  {
    title: "Resolve with Qloo",
    body: "Bragi maps those signals to the Qloo taste graph and retrieves related affinities.",
  },
  {
    title: "Match Medellín",
    body: "A transparent ranking layer compares that evidence with a curated local catalogue.",
  },
  {
    title: "See why it fits",
    body: "Each recommendation explains the match — with deeper evidence available on demand.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-bragi-paper/80">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-bragi-navy/45">
          How it works
        </p>
        <h2 className="mt-2 max-w-xl font-display text-3xl text-bragi-navy sm:text-4xl">
          Intelligent recommendations, quietly explained
        </h2>
        <p className="mt-3 max-w-2xl text-bragi-navy/65">
          Start with culture you already love. Bragi handles the taste graph and local matching
          behind the scenes — then shows you what to explore next.
        </p>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-[1.35rem] border border-bragi-ink/8 bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.04)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-bragi-accent">
                {String(i + 1).padStart(2, "0")}
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
