import type { AgentStep } from "@/lib/types";

const statusLabel: Record<AgentStep["status"], string> = {
  pending: "Pending",
  running: "Running",
  done: "Done",
  error: "Error",
  skipped: "Skipped",
};

export function AgentSteps({ steps }: { steps: AgentStep[] }) {
  return (
    <section aria-label="Agent workflow" className="space-y-3">
      <h2 className="font-display text-lg text-bragi-mist">Agent steps</h2>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className="flex gap-3 border-b border-bragi-mist/10 py-2 text-sm last:border-0"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <span
              className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${dotClass(step.status)}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium text-bragi-mist">{step.label}</span>
                <span className="text-xs uppercase tracking-wider text-bragi-mist/50">
                  {statusLabel[step.status]}
                </span>
              </div>
              {step.detail && (
                <p className="mt-0.5 truncate text-bragi-mist/60">{step.detail}</p>
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
      return "bg-emerald-400";
    case "running":
      return "bg-bragi-mist animate-pulse";
    case "error":
      return "bg-red-400";
    case "skipped":
      return "bg-bragi-mist/30";
    default:
      return "bg-bragi-mist/20";
  }
}
