import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden text-bragi-mist">
      <div className="absolute inset-0">
        <Image
          src="/brand/background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-90"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-bragi-ink/92 via-bragi-ink/72 to-bragi-ink/35"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-bragi-ink/80 via-transparent to-bragi-ink/40"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto grid min-h-[min(78vh,720px)] max-w-6xl items-end gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-20">
        <div className="animate-fade-up">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-bragi-mist/60">
            Medellín cultural discovery
          </p>
          <h1 className="mt-4 max-w-xl font-display text-4xl leading-[1.08] tracking-tight text-bragi-cream sm:text-5xl lg:text-[3.5rem]">
            Bragi
          </h1>
          <p className="mt-3 max-w-xl font-display text-2xl leading-snug text-bragi-cream/90 sm:text-3xl">
            From the culture you love to Medellín’s independent creators.
          </p>
          <p className="mt-5 max-w-md text-base leading-relaxed text-bragi-mist/75 sm:text-lg">
            Qloo maps your tastes across music, film, and art. Bragi connects those
            affinities to verified local creators, projects, and places — with an
            inspectable why.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#discover"
              className="inline-flex min-h-11 items-center rounded-full bg-bragi-cream px-6 py-3 text-sm font-semibold text-bragi-ink transition duration-200 ease-out hover:bg-white"
            >
              Find my matches
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-11 items-center rounded-full border border-bragi-mist/35 px-6 py-3 text-sm font-medium text-bragi-mist transition duration-200 ease-out hover:border-bragi-mist/70 hover:bg-white/5"
            >
              How it works
            </a>
          </div>
        </div>

        <div
          className="relative animate-fade-up overflow-hidden rounded-[1.75rem] border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
          style={{ animationDelay: "120ms" }}
        >
          <div className="relative aspect-[5/4] sm:aspect-[4/3]">
            <Image
              src="/brand/background.png"
              alt="Abstract Bragi illustration of night sky, moon, and coastal light"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-[center_40%]"
              priority
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-bragi-navy/75 via-transparent to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <p className="font-display text-xl text-bragi-cream sm:text-2xl">
                Music · Film · Art · Place
              </p>
              <p className="mt-1 max-w-sm text-sm text-bragi-mist/80">
                An editorial map from what you love to where Medellín creates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
