"use client";

import { useState } from "react";
import type { TasteProfile } from "@/lib/types";

export function TasteEvidencePanel({
  profile,
  mode,
}: {
  profile: TasteProfile;
  mode: "live" | "sample";
}) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Taste evidence details">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <span className="block font-display text-lg text-bragi-navy">Taste evidence</span>
          <span className="mt-0.5 block text-sm text-bragi-navy/55">
            {mode === "live"
              ? "Resolved entities and affinities from live Qloo — shown for transparency."
              : "Sample mode — entities below are not from Qloo."}
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-bragi-accent">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-bragi-ink/8 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-bragi-navy/40">
                Resolved entities
              </p>
              {profile.resolvedEntities.length === 0 ? (
                <p className="mt-1 text-sm text-bragi-navy/50">None resolved.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm text-bragi-navy/80">
                  {profile.resolvedEntities.map((e) => (
                    <li key={e.id} className="break-words">
                      {e.name}
                      <span className="text-bragi-navy/40"> · id {shortId(e.id)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-bragi-navy/40">
                Related affinities
              </p>
              {profile.affinityEntities.length === 0 ? (
                <p className="mt-1 text-sm text-bragi-navy/50">No affinity entities returned.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm text-bragi-navy/80">
                  {profile.affinityEntities.slice(0, 8).map((e) => (
                    <li key={e.id} className="break-words">
                      {e.name}
                      <span className="text-bragi-navy/40"> · id {shortId(e.id)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {profile.affinityTags.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-bragi-navy/40">Taste tags</p>
              <p className="mt-1 break-words text-sm text-bragi-navy/70">
                {profile.affinityTags.slice(0, 12).join(" · ")}
              </p>
            </div>
          )}
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
