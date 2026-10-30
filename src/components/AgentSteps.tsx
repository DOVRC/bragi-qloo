import type { AgentStep } from "@/lib/types";

const statusLabel: Record<AgentStep["status"], string> = {
  pending: "Pending",
  running: "Running",
  done: "Done",
  error: "Error",
  skipped: "Skipped",
};

export function AgentSteps({ steps }: { steps: AgentStep[] }) {
  const visible = steps.filter((s) => s.status !== "pending");

  return (
    <section aria-label="Agent workflow" className="space-y-3">
      <h3 className="font-display text-lg text-bragi-navy">Agent steps</h3>
      <ol className="space-y-2">
        {(visible.length ? visible : steps).map((step) => (
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
