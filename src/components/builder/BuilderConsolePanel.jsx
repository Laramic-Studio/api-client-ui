import { ChevronRight, Terminal, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUILDER } from "@/constants/testIds";

function levelClass(level) {
  if (level === "error") return "text-[hsl(var(--danger))]";
  if (level === "warn") return "text-[hsl(var(--warning))]";
  if (level === "info") return "text-[hsl(var(--brand))]";
  return "text-foreground/90";
}

function statusClass(status) {
  if (!status) return "text-muted-foreground";
  if (status >= 200 && status < 300) return "text-[hsl(var(--success))]";
  if (status >= 400) return "text-[hsl(var(--danger))]";
  return "text-[hsl(var(--warning))]";
}

function phaseLabel(phase) {
  if (phase === "pre") return "Pre-request";
  if (phase === "post") return "Post-response";
  return "Script";
}

function LogRow({ entry }) {
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 hover:bg-accent/20 font-geom text-[12px]">
      <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-transparent" />
      <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground w-24 pt-0.5">
        {phaseLabel(entry.phase)}
      </span>
      <span className={cn("flex-1 min-w-0 break-words whitespace-pre-wrap", levelClass(entry.level))}>
        {entry.message}
      </span>
    </div>
  );
}

function NetworkRow({ entry }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/20 font-geom text-[12px]">
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="shrink-0 font-semibold text-foreground/90 w-12">{entry.method}</span>
      <span className="flex-1 min-w-0 truncate text-foreground/85">{entry.url}</span>
      <span className={cn("shrink-0 w-10 text-right", statusClass(entry.status))}>
        {entry.status || "—"}
      </span>
      <span className="shrink-0 w-16 text-right text-muted-foreground">
        {entry.durationMs == null ? "—" : `${entry.durationMs} ms`}
      </span>
    </div>
  );
}

export default function BuilderConsolePanel({ entries = [], onClear, onClose }) {
  return (
    <div className="h-full flex flex-col bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
      <div className="h-9 shrink-0 flex items-center gap-2 px-3 border-b border-[hsl(var(--border))]">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[12px] font-medium text-foreground/90">Console</span>
        <span className="text-[11px] text-muted-foreground">All logs</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onClear}
            className="h-7 px-2 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/50"
            data-testid={BUILDER.consoleClear}
          >
            <Trash2 className="h-3.5 w-3.5 inline mr-1" />
            Clear
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              data-testid={BUILDER.consoleClose}
              title="Close console"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto" data-testid={BUILDER.consolePanel}>
        {!entries.length ? (
          <div className="h-full grid place-items-center p-8 text-center text-[12px] text-muted-foreground">
            Send a request to see script output and network activity here.
          </div>
        ) : (
          entries.map((entry) => (
            entry.type === "network"
              ? <NetworkRow key={entry.id} entry={entry} />
              : <LogRow key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}
