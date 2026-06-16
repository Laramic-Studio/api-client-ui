import { EyeOff, Lock, Plus } from "lucide-react";
import { ENV } from "@/constants/testIds";
import { cn } from "@/lib/utils";

export default function EnvironmentVariablesTable({ variables, onUpdate, onRemove, onAdd }) {
  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-[24px_1fr_1fr_28px_28px] gap-1 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-mono border-b border-border">
        <div />
        <div>Variable</div>
        <div>Value</div>
        <div className="text-center">Secret</div>
        <div />
      </div>
      {variables.map((v, i) => (
        <div
          key={v.id || i}
          className="group grid grid-cols-[24px_1fr_1fr_28px_28px] gap-1 px-3 py-1.5 items-center border-b border-border last:border-b-0"
        >
          <input
            type="checkbox"
            checked={v.enabled !== false}
            onChange={(e) => onUpdate(i, { enabled: e.target.checked })}
            className="accent-[hsl(var(--brand))] mx-auto"
            aria-label={`Enable ${v.key || "variable"}`}
          />
          <input
            value={v.key}
            onChange={(e) => onUpdate(i, { key: e.target.value })}
            className="h-8 px-2 rounded bg-muted border border-border text-[12.5px] font-mono"
          />
          <input
            type={v.secret ? "password" : "text"}
            value={v.value}
            onChange={(e) => onUpdate(i, { value: e.target.value })}
            placeholder={v.secret ? "••••••••" : ""}
            className="h-8 px-2 rounded bg-muted border border-border text-[12.5px] font-mono"
          />
          <button
            type="button"
            onClick={() => onUpdate(i, { secret: !v.secret })}
            title={v.secret ? "Remove secret" : "Mark as secret"}
            data-testid={ENV.varSecret(i)}
            className={cn(
              "h-8 w-8 grid place-items-center rounded transition-colors",
              v.secret
                ? "text-[hsl(var(--warning))] hover:bg-accent/50"
                : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent/50",
            )}
          >
            {v.secret ? <Lock className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="h-8 w-8 grid place-items-center rounded text-muted-foreground hover:text-[hsl(var(--danger))] hover:bg-accent/50"
            aria-label="Remove variable"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        data-testid={ENV.varAdd}
        className="w-full text-left px-3 py-2 text-[12.5px] text-muted-foreground hover:bg-accent/50 inline-flex items-center gap-2"
      >
        <Plus className="h-3.5 w-3.5" /> Add variable
      </button>
    </div>
  );
}
