function levelClass(level) {
  if (level === "error") return "text-[hsl(var(--danger))]";
  if (level === "warn") return "text-[hsl(var(--warning))]";
  if (level === "info") return "text-[hsl(var(--brand))]";
  return "text-foreground/90";
}

function phaseLabel(phase) {
  if (phase === "pre") return "Pre-request";
  if (phase === "post") return "Post-response";
  return "Script";
}

export default function ScriptConsolePanel({ logs = [] }) {
  if (!logs.length) {
    return (
      <div className="h-full grid place-items-center p-8 text-center">
        <div className="max-w-sm text-[12px] text-muted-foreground leading-relaxed">
          Script output from pre-request and post-response scripts appears here after you send a request.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto font-mono text-[12px]" data-testid="response-console">
      {logs.map((entry, index) => (
        <div
          key={`${entry.phase}-${index}`}
          className="flex items-start gap-2 px-3 py-1.5 border-b border-[hsl(var(--border))]/60 hover:bg-accent/20"
        >
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground w-24 pt-0.5">
            {phaseLabel(entry.phase)}
          </span>
          <span className={`shrink-0 text-[10px] uppercase w-10 pt-0.5 ${levelClass(entry.level)}`}>
            {entry.level || "log"}
          </span>
          <span className={`flex-1 min-w-0 break-words whitespace-pre-wrap ${levelClass(entry.level)}`}>
            {entry.message}
          </span>
        </div>
      ))}
    </div>
  );
}
