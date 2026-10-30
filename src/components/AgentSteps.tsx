"use client";

import { useState } from "react";
import type { AgentStep } from "@/lib/types";

const statusLabel: Record<AgentStep["status"], string> = {
  pending: "Pending",
  running: "Running",
  done: "Done",
  error: "Error",
  skipped: "Skipped",
};

export function AgentSteps({ steps }: { steps: AgentStep[] }) {
  const [open, setOpen] = useState(false);
  const visible = steps.filter((s) => s.status !== "pending");
  const list = visible.length ? visible : steps;

  return (
    <section aria-label="Discovery process details">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <span className="block font-display text-lg text-bragi-navy">How we searched</span>
          <span className="mt-0.5 block text-sm text-bragi-navy/55">
            Optional trace of each discovery step for judges and curious explorers.
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-bragi-accent">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <ol className="mt-4 space-y-2 border-t border-bragi-ink/8 pt-4">
          {list.map((step) => (
            <li
              key={step.id}
              className="flex gap-3 border-b border-bragi-ink/8 py-2 text-sm last:border-0"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass(step.status)}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium text-bragi-navy">{step.label}</span>
                  <span className="text-xs uppercase tracking-wider text-bragi-navy/40">
                    {statusLabel[step.status]}
                  </span>
                </div>
                {step.detail && (
                  <p className="mt-0.5 break-words text-bragi-navy/55">{step.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function dotClass(status: AgentStep["status"]): string {
  switch (status) {
    case "done":
      return "bg-emerald-500";
    case "running":
      return "bg-bragi-accent animate-pulse";
    case "error":
      return "bg-red-500";
    case "skipped":
      return "bg-bragi-navy/25";
    default:
      return "bg-bragi-navy/15";
  }
}
