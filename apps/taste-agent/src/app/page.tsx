import Image from "next/image";
import { DiscoveryForm } from "@/components/DiscoveryForm";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-atmosphere">
      <div className="bg-grain pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 pb-24 pt-8 md:px-10">
        <header className="flex items-center justify-between gap-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/LogoTextoCuadrado.png"
              alt="Bragi"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
            <span className="sr-only">Bragi</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-bragi-mist/50">
            Medellín · Qloo Agentic Hackathon 2026
          </p>
        </header>

        <section className="mt-16 max-w-3xl animate-fade-up md:mt-24" style={{ animationDelay: "80ms" }}>
          <p className="font-display text-5xl leading-none tracking-tight text-bragi-mist md:text-7xl">
            Bragi
          </p>
          <h1 className="mt-4 max-w-xl font-display text-xl font-light leading-snug text-bragi-mist/85 md:text-2xl">
            Discover local creativity through your cultural DNA.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-bragi-mist/60 md:text-base">
            Share the artists, films, and genres you love. Bragi uses Qloo Taste
            Intelligence to find affinities, then matches them to cultural
            experiences in Medellín — with evidence, not guesswork.
          </p>
        </section>

        <section
          id="discover"
          className="mt-14 max-w-2xl animate-fade-up md:mt-20"
          style={{ animationDelay: "160ms" }}
        >
          <DiscoveryForm />
        </section>

        <footer className="mt-auto pt-20 text-xs text-bragi-mist/40">
          Bragi Taste Agent · cultural matching via Qloo · catalogue entries marked
          demonstration are not live bookings.
        </footer>
      </div>
    </main>
  );
}
