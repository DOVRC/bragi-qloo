export function HeroSection() {
  return (
    <section className="relative overflow-hidden hero-surface text-bragi-mist">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-20 lg:pt-16">
        <div className="animate-fade-up">
          <p className="text-xs uppercase tracking-[0.22em] text-bragi-mist/55">
            Medellín · Qloo Agentic Hackathon 2026
          </p>
          <h1 className="mt-4 max-w-xl font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Your taste. Your next discovery.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-bragi-mist/70 sm:text-lg">
            From the music you love to the experiences you&apos;ll remember.
            Discover Medellín&apos;s creative scene through Qloo-powered cultural
            intelligence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#discover"
              className="inline-flex min-h-11 items-center rounded-full bg-bragi-mist px-6 py-3 text-sm font-semibold text-bragi-ink transition hover:bg-white"
            >
              Discover my taste
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-11 items-center rounded-full border border-bragi-mist/35 px-6 py-3 text-sm font-medium text-bragi-mist transition hover:border-bragi-mist/70"
            >
              How it works
            </a>
          </div>
        </div>

        <div
          className="relative min-h-[220px] animate-fade-up overflow-hidden rounded-2xl border border-white/10 bg-bragi-slate/50 p-6 sm:min-h-[280px]"
          style={{ animationDelay: "100ms" }}
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(199,206,235,0.25),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(75,98,193,0.28),transparent_40%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <p className="font-display text-2xl text-bragi-mist/90">Cultural DNA</p>
            <ul className="space-y-2 text-sm text-bragi-mist/65">
              <li>Music → affinities → local stages</li>
              <li>Film → visual arts → Medellín venues</li>
              <li>Qloo evidence → Bragi matching</li>
            </ul>
            <p className="text-xs uppercase tracking-widest text-bragi-mist/45">
              Cross-domain taste intelligence
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
