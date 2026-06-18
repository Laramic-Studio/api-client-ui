import { useState } from "react";
import { Loader2, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_STYLES = {
  low: "border-border",
  medium: "border-[hsl(var(--brand))]/40",
  high: "border-[hsl(var(--danger))]/50",
};

export default function AiActionCard({ action, onRun, onDismiss, running }) {
  const [done, setDone] = useState(false);
  const risk = action.risk || "low";

  const run = async () => {
    await onRun(action);
    setDone(true);
  };

  if (done) {
    return (
      <div className="rounded-md border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 px-3 py-2 text-[12px] text-foreground/85">
        {action.label} — completed
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-md border bg-card px-3 py-2.5 space-y-2", RISK_STYLES[risk] || RISK_STYLES.low)}
      data-testid={`ai-action-${action.id}`}
    >
      <div>
        <div className="text-[13px] font-medium">{action.label}</div>
        {action.description && (
          <div className="text-[11.5px] text-muted-foreground mt-0.5">{action.description}</div>
        )}
        {risk === "high" && (
          <div className="text-[11px] text-[hsl(var(--danger))] mt-1">This action cannot be undone.</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="h-7 px-2.5 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white text-[11.5px] font-medium inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Run
        </button>
        <button
          type="button"
          onClick={() => onDismiss(action.id)}
          className="h-7 px-2 rounded-md border border-border text-[11.5px] text-muted-foreground hover:bg-accent/40 inline-flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Dismiss
        </button>
      </div>
    </div>
  );
}
