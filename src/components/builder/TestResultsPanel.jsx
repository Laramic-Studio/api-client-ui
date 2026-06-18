import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";

function PhaseHeader({ title, status }) {
  const tone = status === "passed"
    ? "text-[hsl(var(--success))]"
    : status === "failed"
      ? "text-[hsl(var(--danger))]"
      : "text-muted-foreground";

  const label = status === "passed" ? "Passed" : status === "failed" ? "Failed" : "Skipped";

  return (
    <div className="px-3 py-2 border-b border-[hsl(var(--border))] flex items-center gap-2">
      <div className="text-[11px] uppercase tracking-wider font-mono text-foreground/90">{title}</div>
      <span className={`text-[11px] font-mono ${tone}`}>{label}</span>
    </div>
  );
}

function ResultRows({ results, emptyMessage }) {
  if (!results?.length) {
    return (
      <div className="px-3 py-4 text-[12px] text-muted-foreground">{emptyMessage}</div>
    );
  }

  return (
    <div className="divide-y divide-[hsl(var(--border))]">
      {results.map((r) => (
        <div key={r.id} className="flex items-start gap-2 px-3 py-2 text-[12px] font-mono">
          {r.passed
            ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))] shrink-0 mt-0.5" />
            : <XCircle className="h-3.5 w-3.5 text-[hsl(var(--danger))] shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <div className="text-foreground/90 break-words">{r.name}</div>
            {!r.passed && r.error && (
              <div className="text-[hsl(var(--danger))] text-[11px] mt-0.5 break-words">{r.error}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TestResultsPanel({ testResults }) {
  const pre = testResults?.pre || { status: "skipped", results: [] };
  const post = testResults?.post || { status: "skipped", results: [] };
  const hasAny = pre.status !== "skipped" || post.status !== "skipped";

  if (!hasAny) {
    return (
      <div className="h-full grid place-items-center p-8 text-center">
        <div className="max-w-sm text-[12px] text-muted-foreground leading-relaxed">
          <MinusCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground/70" />
          Send a request to run the pre-request script and post-response tests.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" data-testid="response-test-results">
      <PhaseHeader title="Pre-request" status={pre.status} />
      <ResultRows
        results={pre.results}
        emptyMessage={pre.status === "skipped" ? "No pre-request script." : "No pre-request checks recorded."}
      />
      <PhaseHeader title="Post-response" status={post.status} />
      <ResultRows
        results={post.results}
        emptyMessage={post.status === "skipped" ? "No post-response tests." : "No post-response checks recorded."}
      />
    </div>
  );
}
