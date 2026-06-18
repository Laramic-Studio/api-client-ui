import Editor from "@monaco-editor/react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function TestsPanel({ tests, onChange, results }) {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 px-3 py-2 border-b border-[hsl(var(--border))] text-[11.5px] text-muted-foreground leading-relaxed">
        One assertion per line; <span className="font-mono text-foreground/75">{"//"}</span> comments allowed.
        <div className="mt-1 font-mono text-[11px] text-foreground/70 space-y-0.5">
          <div>expect(response.status).toBe(200)</div>
          <div>expect(response.body.success).toEqual(true)</div>
          <div>expect(response.durationMs).toBeLessThan(5000)</div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language="javascript"
          value={tests || ""}
          onChange={(v) => onChange(v || "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "JetBrains Mono, monospace",
            padding: { top: 8 },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
          }}
        />
      </div>
      {results.length > 0 && (
        <div className="shrink-0 border-t border-[hsl(var(--border))] max-h-44 overflow-auto">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
            Test results
            <span className="text-[hsl(var(--success))]">{results.filter((r) => r.passed).length} passed</span>
            <span className="text-[hsl(var(--danger))]">{results.filter((r) => !r.passed).length} failed</span>
          </div>
          {results.map((r) => (
            <div key={r.id} className="flex items-start gap-2 px-3 py-1.5 text-[12px] font-mono border-t border-[hsl(var(--border))]">
              {r.passed
                ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                : <XCircle className="h-3.5 w-3.5 text-[hsl(var(--danger))] shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="text-foreground/90 truncate">{r.name}</div>
                {!r.passed && <div className="text-[hsl(var(--danger))] text-[11px]">{r.error}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
