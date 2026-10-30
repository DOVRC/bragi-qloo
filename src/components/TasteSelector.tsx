"use client";

import { useEffect, useId, useState } from "react";
import {
  PRESET_A,
  PRESET_B,
  SUGGESTED_PREFERENCES,
} from "@/lib/presets";

interface SearchHit {
  id: string;
  name: string;
}

export function TasteSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const q = draft.trim();
    if (q.length < 2) {
      setHits([]);
      setSearchError(null);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(q)}`);
        const data = (await res.json()) as {
          ok: boolean;
          results?: SearchHit[];
          error?: { message: string };
        };
        if (!res.ok || !data.ok) {
          setHits([]);
          setSearchError(data.error?.message ?? "Search unavailable");
          return;
        }
        setHits(data.results ?? []);
      } catch {
        setHits([]);
        setSearchError("Could not reach search.");
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [draft]);

  function add(label: string) {
    const value = label.trim();
    if (!value) return;
    if (selected.some((s) => s.toLowerCase() === value.toLowerCase())) return;
    onChange([...selected, value]);
    setDraft("");
    setHits([]);
  }

  function remove(label: string) {
    onChange(selected.filter((s) => s !== label));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange([...PRESET_A])}
          className="rounded-full border border-bragi-ink/15 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-bragi-navy hover:border-bragi-accent/40"
        >
          Preset A · art-house
        </button>
        <button
          type="button"
          onClick={() => onChange([...PRESET_B])}
          className="rounded-full border border-bragi-ink/15 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-bragi-navy hover:border-bragi-accent/40"
        >
          Preset B · urban/latin
        </button>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-full px-3 py-1.5 text-xs text-bragi-navy/55 underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-bragi-navy/45">
          Suggested cultural signals
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PREFERENCES.map((opt) => {
            const active = selected.some(
              (s) => s.toLowerCase() === opt.label.toLowerCase(),
            );
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => (active ? remove(opt.label) : add(opt.label))}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-bragi-accent text-white"
                    : "bg-bragi-paper text-bragi-navy hover:bg-bragi-mist/60"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-bragi-navy">
          Add or search a preference
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={inputId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(draft);
              }
            }}
            placeholder="Artist, film, genre…"
            className="min-h-11 w-full rounded-xl border border-bragi-ink/10 bg-white px-4 text-bragi-navy outline-none focus:border-bragi-accent/50"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => add(draft)}
            className="min-h-11 rounded-xl bg-bragi-navy px-5 text-sm font-semibold text-bragi-mist"
          >
            Add
          </button>
        </div>
        {(searching || hits.length > 0 || searchError) && draft.trim().length >= 2 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-bragi-ink/10 bg-white shadow-lg sm:max-w-md">
            {searching && (
              <p className="px-4 py-3 text-sm text-bragi-navy/50">Searching Qloo…</p>
            )}
            {searchError && !searching && (
              <p className="px-4 py-3 text-sm text-amber-800">{searchError}</p>
            )}
            {!searching &&
              hits.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  className="block w-full px-4 py-2.5 text-left text-sm text-bragi-navy hover:bg-bragi-paper"
                  onClick={() => add(hit.name)}
                >
                  {hit.name}
                  <span className="ml-2 text-xs text-bragi-navy/40">Qloo entity</span>
                </button>
              ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-bragi-navy/45">
          Selected ({selected.length})
        </p>
        {selected.length === 0 ? (
          <p className="text-sm text-bragi-navy/50">
            Pick chips, use a preset, or search Qloo entities.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {selected.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="inline-flex items-center gap-2 rounded-full bg-bragi-ink px-3 py-1.5 text-sm text-bragi-mist"
                  aria-label={`Remove ${item}`}
                >
                  {item}
                  <span aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
