import MethodBadge from "@/components/shared/MethodBadge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, SkipForward, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

function StepRow({ step, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  const Icon = step.skipped ? SkipForward : step.ok ? CheckCircle2 : XCircle;
  const color = step.skipped
    ? "text-muted-foreground"
    : step.ok
      ? "text-[hsl(var(--success))]"
      : "text-[hsl(var(--danger))]";

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-accent/30"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        <Icon className={cn("h-4 w-4 shrink-0", color)} />
        <MethodBadge method={step.method || "GET"} />
        <span className="text-[12px] font-medium truncate flex-1">{step.name}</span>
        {!step.skipped && (
          <span className={cn("text-[11px] font-mono", step.ok ? "text-[hsl(var(--success))]" : "text-[hsl(var(--danger))]")}>
            {step.status ?? "—"}
          </span>
        )}
        {step.skipped && <span className="text-[10px] uppercase text-muted-foreground">skipped</span>}
        <span className="text-[11px] text-muted-foreground font-mono">{step.durationMs ?? 0}ms</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pl-10 space-y-2 text-[11px]">
          {step.url && <div className="font-mono text-muted-foreground truncate">{step.url}</div>}
          {step.error && <div className="text-[hsl(var(--danger))]">{step.error}</div>}
          {step.extracted?.length > 0 && (
            <div className="space-y-0.5">
              {step.extracted.map((ex, i) => (
                <div key={i} className="font-mono text-[hsl(var(--brand))]">
                  {ex.path} → {ex.variable}: {JSON.stringify(ex.value)}
                </div>
              ))}
            </div>
          )}
          {step.responseBody != null && (
            <pre className="rounded bg-muted/40 p-2 overflow-auto max-h-[160px] font-mono text-[10px]">
              {typeof step.responseBody === "string" ? step.responseBody : JSON.stringify(step.responseBody, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConduitRunPanel({ result, runs = [], onSelectRun }) {
  const active = result || runs[0];

  if (!active && runs.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-[12px] text-muted-foreground text-center">
        Run the flow to see per-step results here.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden flex flex-col max-h-[320px]">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
        <div className="text-[12px] font-medium">
          {active.success ? "Run succeeded" : "Run finished"}
          <span className="text-muted-foreground font-normal ml-1.5">({active.durationMs}ms)</span>
        </div>
        {runs.length > 1 && (
          <select
            className="h-7 px-2 rounded border border-border bg-background text-[11px]"
            onChange={(e) => onSelectRun?.(runs.find((r) => r.id === e.target.value))}
            defaultValue={active.id}
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {new Date(r.createdAt || r.finishedAt).toLocaleString()} — {r.success ? "OK" : "Failed"}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="overflow-auto flex-1">
        {(active.steps || []).map((step, idx) => (
          <StepRow key={step.stepId || idx} step={step} defaultOpen={!step.ok && !step.skipped} />
        ))}
      </div>
      {active.variables && Object.keys(active.variables).length > 0 && (
        <div className="px-3 py-2 border-t border-border bg-muted/20">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Flow variables</div>
          <pre className="text-[10px] font-mono overflow-auto max-h-[80px]">{JSON.stringify(active.variables, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
