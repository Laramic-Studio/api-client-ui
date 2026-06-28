import MethodBadge from "@/components/shared/MethodBadge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export default function ConduitStepCard({ step, onExtractChange, onRemove }) {
  return (
    <div className={cn("min-w-[240px] rounded-md border bg-card border-border p-3 relative group")}>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 h-6 w-6 grid place-items-center rounded opacity-0 group-hover:opacity-100 hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))]"
          aria-label="Remove step"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="flex items-center gap-2 pr-6">
        <MethodBadge method={step.method} />
        <span className="text-[12.5px] font-medium truncate">{step.name}</span>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground font-geom truncate">{step.url}</div>
      <div className="mt-2">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-geom">
          Extract
        </label>
        <input
          value={step.extract || ""}
          onChange={(e) => onExtractChange?.(e.target.value)}
          placeholder="e.g. token or user.id"
          className="mt-0.5 w-full h-7 px-2 rounded border border-border bg-background text-[11px] font-geom outline-none focus:border-[hsl(var(--brand))]/50"
        />
      </div>
    </div>
  );
}

export function ConduitRunResults({ result, onClose }) {
  if (!result) return null;

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="text-[13px] font-medium">
            {result.success ? "Flow completed" : "Flow stopped"}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {result.steps.length} step{result.steps.length === 1 ? "" : "s"} executed
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-2.5 rounded-md border border-border hover:bg-accent/50 text-[12px]"
          >
            Dismiss
          </button>
        )}
      </div>

      <div className="divide-y divide-border max-h-[420px] overflow-auto">
        {result.steps.map((step, idx) => (
          <div key={step.nodeId || idx} className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-geom w-5">{idx + 1}.</span>
              <MethodBadge method={step.method} />
              <span className="text-[12.5px] font-medium">{step.name}</span>
              <span
                className={cn(
                  "ml-auto text-[11px] font-geom px-1.5 py-0.5 rounded",
                  step.response?.ok
                    ? "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10"
                    : "text-[hsl(var(--danger))] bg-[hsl(var(--danger))]/10",
                )}
              >
                {step.response?.status ?? "—"}
              </span>
              <span className="text-[11px] text-muted-foreground font-geom">
                {step.response?.durationMs}ms
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground font-geom truncate pl-7">{step.url}</div>
            {step.extracted && (
              <div className="pl-7 text-[11px] font-geom text-[hsl(var(--brand))]">
                extracted {step.extracted.path} → {JSON.stringify(step.extracted.value)}
              </div>
            )}
            {!step.ok && step.response?.body?.message && (
              <div className="pl-7 text-[11px] text-[hsl(var(--danger))]">{step.response.body.message}</div>
            )}
          </div>
        ))}
      </div>

      {Object.keys(result.variables || {}).length > 0 && (
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-geom mb-1.5">
            Flow variables
          </div>
          <pre className="text-[11px] font-geom text-foreground/90 overflow-auto">
            {JSON.stringify(result.variables, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
