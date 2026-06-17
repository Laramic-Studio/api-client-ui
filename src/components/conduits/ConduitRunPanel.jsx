import MethodBadge from "@/components/shared/MethodBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, SkipForward, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

function formatBody(body, raw) {
  if (raw && typeof raw === "string" && raw.trim()) {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }
  if (body == null) return null;
  if (typeof body === "string") {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return JSON.stringify(body, null, 2);
}

function StepRow({ step, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyText = formatBody(step.responseBody, step.responseRaw);
  const headersText = step.responseHeaders
    ? JSON.stringify(step.responseHeaders, null, 2)
    : null;

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
          {step.url && <div className="font-mono text-muted-foreground break-all">{step.url}</div>}
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
          {(bodyText || headersText) && (
            <Tabs defaultValue="body" className="w-full">
              <TabsList className="h-8">
                <TabsTrigger value="body" className="text-[10px] px-2">Body</TabsTrigger>
                {headersText && <TabsTrigger value="headers" className="text-[10px] px-2">Headers</TabsTrigger>}
              </TabsList>
              <TabsContent value="body" className="mt-1">
                {bodyText ? (
                  <pre className="rounded-md border border-border bg-muted/30 p-2 overflow-auto max-h-[280px] font-mono text-[10px] whitespace-pre-wrap break-all">
                    {bodyText}
                  </pre>
                ) : (
                  <div className="text-muted-foreground">No response body</div>
                )}
              </TabsContent>
              {headersText && (
                <TabsContent value="headers" className="mt-1">
                  <pre className="rounded-md border border-border bg-muted/30 p-2 overflow-auto max-h-[280px] font-mono text-[10px] whitespace-pre-wrap break-all">
                    {headersText}
                  </pre>
                </TabsContent>
              )}
            </Tabs>
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
      <div className="text-[12px] text-muted-foreground text-center py-8">
        Run the flow to see per-step results here.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-0 py-2 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <div className="text-[12px] font-medium">
          {active.success ? "Run succeeded" : "Run finished"}
          <span className="text-muted-foreground font-normal ml-1.5">({active.durationMs}ms)</span>
        </div>
        {runs.length > 1 && (
          <Select
            defaultValue={active.id}
            onValueChange={(id) => onSelectRun?.(runs.find((r) => r.id === id))}
          >
            <SelectTrigger className="h-7 w-[200px] text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {runs.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-[11px]">
                  {new Date(r.createdAt || r.finishedAt).toLocaleString()} — {r.success ? "OK" : "Failed"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="overflow-auto flex-1 min-h-0">
        {(active.steps || []).map((step, idx) => (
          <StepRow key={step.stepId || idx} step={step} defaultOpen={!step.ok && !step.skipped} />
        ))}
      </div>
      {active.variables && Object.keys(active.variables).length > 0 && (
        <div className="px-3 py-2 border-t border-border bg-muted/20 shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Flow variables</div>
          <pre className="text-[10px] font-mono overflow-auto max-h-[80px]">{JSON.stringify(active.variables, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
