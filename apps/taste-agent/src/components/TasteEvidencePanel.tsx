import type { TasteProfile } from "@/lib/types";

export function TasteEvidencePanel({
  profile,
  mode,
}: {
  profile: TasteProfile;
  mode: "live" | "sample";
}) {
  return (
    <section aria-label="Taste evidence" className="space-y-4 border-t border-bragi-mist/15 pt-6">
      <h2 className="font-display text-lg text-bragi-mist">Taste evidence</h2>
      <p className="max-w-2xl text-sm text-bragi-mist/55">
        {mode === "live"
          ? "Qloo entities and tags below are from live API responses. Catalogue matching is a Bragi application-layer step."
          : "Sample mode — entities below are not from Qloo."}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-bragi-mist/45">Resolved entities</p>
          {profile.resolvedEntities.length === 0 ? (
            <p className="mt-1 text-sm text-bragi-mist/50">None resolved.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm text-bragi-mist/80">
              {profile.resolvedEntities.map((e) => (
                <li key={e.id}>
                  {e.name}
                  <span className="text-bragi-mist/40">
                    {" "}
                    · id {shortId(e.id)}
                    {e.type ? ` · ${e.type}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-bragi-mist/45">
            Insights affinities (sample)
          </p>
          {profile.affinityEntities.length === 0 ? (
            <p className="mt-1 text-sm text-bragi-mist/50">No affinity entities returned.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm text-bragi-mist/80">
              {profile.affinityEntities.slice(0, 8).map((e) => (
                <li key={e.id}>
                  {e.name}
                  <span className="text-bragi-mist/40"> · id {shortId(e.id)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {profile.affinityTags.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-bragi-mist/45">Taste tags</p>
          <p className="mt-1 text-sm text-bragi-mist/70">
            {profile.affinityTags.slice(0, 12).join(" · ")}
          </p>
        </div>
      )}
    </section>
  );
}

function shortId(id: string): string {
  if (id.startsWith("sample-")) return id;
  if (id.length <= 10) return "***";
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}
