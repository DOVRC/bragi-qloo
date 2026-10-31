export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-bragi-navy/45">
              About Bragi
            </p>
            <h2 className="mt-2 font-display text-3xl text-bragi-navy sm:text-4xl">
              Local creativity, culturally grounded
            </h2>
            <p className="mt-4 max-w-xl text-bragi-navy/70">
              Bragi Taste Agent helps people in Medellín discover independent artists and
              cultural experiences through their taste DNA. Qloo supplies cross-domain
              affinities; Bragi matches those signals to a curated local catalogue and
              explains the evidence.
            </p>
            <p className="mt-4 max-w-xl text-sm text-bragi-navy/55">
              Built for the Qloo Agentic Hackathon 2026 by Daniel Ossa Velásquez and Yulian
              Bedoya (Colombia). Evolved from an earlier artist-marketplace concept into a
              taste-intelligence product — without blockchain or Internet Computer runtime.
            </p>
          </div>
          <div className="rounded-3xl border border-bragi-ink/10 bg-bragi-cream p-6">
            <h3 className="font-display text-xl text-bragi-navy">How recommendations work</h3>
            <ul className="mt-4 space-y-3 text-sm text-bragi-navy/70">
              <li>
                <strong className="text-bragi-navy">Qloo Search / Tags</strong> resolve your
                signals to entities and genre identifiers.
              </li>
              <li>
                <strong className="text-bragi-navy">Qloo Insights</strong> return affinity
                entities and tags chosen conditionally from those signals.
              </li>
              <li>
                <strong className="text-bragi-navy">Bragi ranking</strong> scores catalogue
                overlap with an explicit evidence threshold; verified venues are preferred.
              </li>
              <li>
                Live mode never invents demonstration profiles when verified matches are empty;
                demonstration entries remain labeled and sample-mode only.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
