import { AlertTriangle, CircleAlert, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUILDER } from "@/constants/testIds";
import { countConsoleIssues } from "@/lib/builder/builder-console";

export default function BuilderStatusBar({
  consoleOpen,
  onToggleConsole,
  consoleEntries = [],
}) {
  const { errors, warnings } = countConsoleIssues(consoleEntries);

  return (
    <div
      className="h-8 shrink-0 flex items-center gap-3 px-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[11.5px]"
      data-testid={BUILDER.statusBar}
    >
      <button
        type="button"
        onClick={onToggleConsole}
        className={cn(
          "inline-flex items-center gap-1.5 h-6 px-2 rounded hover:bg-accent/50",
          consoleOpen ? "text-[hsl(var(--brand))]" : "text-muted-foreground hover:text-foreground",
        )}
        data-testid={BUILDER.consoleToggle}
      >
        <Terminal className="h-3.5 w-3.5" />
        Console
      </button>

      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="inline-flex items-center gap-1" title="Console errors">
          <CircleAlert className="h-3 w-3" />
          {errors}
        </span>
        <span className="inline-flex items-center gap-1" title="Console warnings">
          <AlertTriangle className="h-3 w-3" />
          {warnings}
        </span>
      </div>
    </div>
  );
}
