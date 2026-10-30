"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const listboxId = useId();
  const [draft, setDraft] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestId = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = draft.trim();
    if (q.length < 2) {
      setHits([]);
      setSearchError(null);
      setSearching(false);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const myId = ++requestId.current;
    const handle = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      setOpen(true);
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          ok: boolean;
          results?: SearchHit[];
          error?: { message: string };
        };
        if (myId !== requestId.current) return;
        if (!res.ok || !data.ok) {
          setHits([]);
          setSearchError(data.error?.message ?? "Search unavailable");
          return;
        }
        const next = data.results ?? [];
        setHits(next);
        setActiveIndex(next.length ? 0 : -1);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (myId !== requestId.current) return;
        setHits([]);
        setSearchError("Could not reach search.");
      } finally {
        if (myId === requestId.current) setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [draft]);

  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  function add(label: string) {
    const value = label.trim();
    if (!value) return;
    if (selected.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      setHits([]);
      setOpen(false);
      return;
    }
    onChange([...selected, value]);
    setDraft("");
    setHits([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function remove(label: string) {
    onChange(selected.filter((s) => s !== label));
  }

  const showList = open && draft.trim().length >= 2;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-bragi-navy/45">
          Explore a mood
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange([...PRESET_A])}
            className="min-h-10 rounded-full border border-bragi-ink/12 bg-white px-4 text-sm text-bragi-navy transition duration-200 ease-out hover:border-bragi-accent/40 hover:bg-bragi-paper"
          >
            Explore an artistic side
          </button>
          <button
            type="button"
            onClick={() => onChange([...PRESET_B])}
            className="min-h-10 rounded-full border border-bragi-ink/12 bg-white px-4 text-sm text-bragi-navy transition duration-200 ease-out hover:border-bragi-accent/40 hover:bg-bragi-paper"
          >
            Explore urban culture
          </button>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="min-h-10 rounded-full px-3 text-sm text-bragi-navy/55 underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-bragi-navy/45">
          What inspires you?
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
                className={`min-h-10 rounded-full px-3.5 text-sm transition duration-200 ease-out ${
                  active
                    ? "bg-bragi-accent text-white shadow-sm"
                    : "bg-bragi-paper text-bragi-navy hover:bg-bragi-mist/50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative" ref={wrapRef}>
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-bragi-navy">
          Search or add a taste
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={inputId}
            value={draft}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
            }
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => {
              if (draft.trim().length >= 2) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
                setActiveIndex(-1);
                return;
              }
              if (e.key === "ArrowDown" && showList && hits.length) {
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % hits.length);
                return;
              }
              if (e.key === "ArrowUp" && showList && hits.length) {
                e.preventDefault();
                setActiveIndex((i) => (i <= 0 ? hits.length - 1 : i - 1));
                return;
              }
              if (e.key === "Enter") {
                e.preventDefault();
                if (showList && activeIndex >= 0 && hits[activeIndex]) {
                  add(hits[activeIndex].name);
                } else {
                  add(draft);
                }
              }
            }}
            placeholder="Artist, film, genre…"
            className="min-h-11 w-full rounded-2xl border border-bragi-ink/10 bg-white px-4 text-bragi-navy outline-none transition duration-200 ease-out focus:border-bragi-accent/45"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => add(draft)}
            className="min-h-11 rounded-2xl bg-bragi-navy px-5 text-sm font-semibold text-bragi-mist transition duration-200 ease-out hover:bg-bragi-ink"
          >
            Add
          </button>
        </div>

        {showList && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Taste search results"
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-bragi-ink/10 bg-white shadow-xl sm:max-w-md"
          >
            {searching && (
              <p className="px-4 py-3 text-sm text-bragi-navy/50" aria-live="polite">
                Searching…
              </p>
            )}
            {searchError && !searching && (
              <p className="px-4 py-3 text-sm text-amber-800" role="alert">
                {searchError}
              </p>
            )}
            {!searching && !searchError && hits.length === 0 && (
              <p className="px-4 py-3 text-sm text-bragi-navy/50">
                No matches — press Add to keep your wording.
              </p>
            )}
            {!searching &&
              hits.map((hit, index) => (
                <button
                  key={hit.id}
                  id={`${listboxId}-opt-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`block w-full px-4 py-2.5 text-left text-sm transition duration-150 ease-out ${
                    index === activeIndex
                      ? "bg-bragi-paper text-bragi-navy"
                      : "text-bragi-navy hover:bg-bragi-paper"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => add(hit.name)}
                >
                  {hit.name}
                  <span className="ml-2 text-xs text-bragi-navy/40">from taste graph</span>
                </button>
              ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-bragi-navy/45">
          Your tastes ({selected.length})
        </p>
        {selected.length === 0 ? (
          <p className="text-sm text-bragi-navy/50">
            Pick a few inspirations, try a mood, or search.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {selected.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-bragi-ink px-3.5 text-sm text-bragi-mist transition duration-200 ease-out hover:bg-bragi-slate"
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
