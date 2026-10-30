export function SiteFooter() {
  return (
    <footer className="border-t border-bragi-ink/10 bg-bragi-ink text-bragi-mist/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-lg text-bragi-mist">Bragi Taste Agent</p>
          <p className="mt-1 text-sm">
            Cultural discovery via Qloo · Medellín demo · MIT-licensed source
          </p>
        </div>
        <div className="text-sm">
          <a
            href="https://github.com/DOVRC/bragi-qloo"
            className="underline decoration-bragi-mist/30 underline-offset-4 hover:text-bragi-mist"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span className="mx-2 opacity-40">·</span>
          <a
            href="https://qloo.devpost.com/"
            className="underline decoration-bragi-mist/30 underline-offset-4 hover:text-bragi-mist"
            target="_blank"
            rel="noopener noreferrer"
          >
            Qloo Hackathon
          </a>
        </div>
      </div>
    </footer>
  );
}
