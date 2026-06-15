// Public read-only documentation page accessible via /p/docs/:shareId
// (no auth required). Renders a Stripe-style API reference for a single collection.
import { useParams, Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import MethodBadge from "@/components/shared/MethodBadge";
import Editor from "@monaco-editor/react";
import { KeyRound, Copy, ExternalLink, BookOpenText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PublicDocs() {
  const { shareId } = useParams();
  const lookupShare = useAppStore((s) => s.lookupShare);
  const collection = lookupShare(shareId);
  const [activeReqId, setActiveReqId] = useState(null);
  const activeReq = collection?.requests.find((r) => r.id === activeReqId) || collection?.requests[0];

  if (!collection) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground grid place-items-center p-6">
        <div className="text-center max-w-md">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// 404</div>
          <h1 className="mt-2 text-2xl font-medium tracking-tight">This docs link is not active</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            The owner may have revoked it, or it never existed. Ask the team for a fresh link.
          </p>
          <Link to="/" className="mt-6 inline-block text-[hsl(var(--brand))] hover:underline text-[13px]">← Back to Noidr</Link>
        </div>
      </div>
    );
  }

  const example = {
    success: true,
    data: { id: 1, ref: "abc123", createdAt: new Date().toISOString() },
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <header className="h-12 border-b border-[hsl(var(--border))] flex items-center px-4 gap-3">
        <BookOpenText className="h-4 w-4 text-[hsl(var(--brand))]" />
        <div className="text-[13.5px] font-medium tracking-tight">{collection.name} <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider ml-2">/ public docs</span></div>
        <Link to="/" className="ml-auto text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          Open in Noidr <ExternalLink className="h-3 w-3" />
        </Link>
      </header>
      <div className="flex-1 grid grid-cols-[260px_1fr]">
        <aside className="border-r border-[hsl(var(--border))] overflow-y-auto p-2">
          <div className="px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Endpoints</div>
          {collection.requests.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveReqId(r.id)}
              className={`w-full flex items-center gap-2 h-8 px-2 rounded text-[12.5px] hover:bg-accent/40 ${activeReq?.id === r.id ? "bg-accent" : ""}`}
              data-testid={`pdocs-req-${r.id}`}
            >
              <MethodBadge method={r.method} className="w-12 text-left" />
              <span className="truncate">{r.name}</span>
            </button>
          ))}
        </aside>
        <main className="overflow-auto p-8">
          <div className="max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// reference</div>
            <h1 className="mt-1 text-3xl font-medium tracking-tight">{collection.name}</h1>
            <p className="mt-2 text-[13.5px] text-muted-foreground">Auto-generated API reference. Updated when the owner publishes changes.</p>

            <div className="mt-6 rounded-md border border-[hsl(var(--border))] bg-card p-5">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono inline-flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5" /> Authentication
              </div>
              <p className="mt-2 text-[13px]">
                All endpoints require a bearer token: <span className="font-mono text-[hsl(var(--brand))]">Authorization: Bearer [[TOKEN]]</span>.
              </p>
            </div>

            {activeReq && (
              <div className="mt-6 space-y-6">
                <div>
                  <div className="flex items-center gap-3">
                    <MethodBadge method={activeReq.method} />
                    <code className="font-mono text-[14px]">{activeReq.url}</code>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(activeReq.url); toast.success("URL copied"); }}
                      className="ml-auto h-7 w-7 grid place-items-center rounded hover:bg-accent/40 text-muted-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <h2 className="mt-3 text-xl font-medium tracking-tight">{activeReq.name}</h2>
                  {activeReq.docs && (
                    <p className="mt-2 text-[13px] text-muted-foreground whitespace-pre-wrap">{activeReq.docs}</p>
                  )}
                </div>

                <Section title="Request headers">
                  {activeReq.headers?.length ? (
                    <TwoCol rows={activeReq.headers} keys={["key", "value"]} cols={["Key", "Value"]} />
                  ) : <span className="text-[12.5px] text-muted-foreground">None.</span>}
                </Section>

                {activeReq.params?.length > 0 && (
                  <Section title="Query parameters">
                    <TwoCol rows={activeReq.params} keys={["key", "value"]} cols={["Name", "Example"]} />
                  </Section>
                )}

                <Section title="Example response — 200 OK">
                  <div className="rounded-md border border-[hsl(var(--border))] overflow-hidden h-72">
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      value={JSON.stringify((activeReq.examples?.[0]?.body) || example, null, 2)}
                      theme="vs-dark"
                      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, fontFamily: "JetBrains Mono, monospace" }}
                    />
                  </div>
                </Section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-md border border-[hsl(var(--border))] bg-card p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
function TwoCol({ rows, cols, keys }) {
  return (
    <div className="rounded-md border border-[hsl(var(--border))] overflow-hidden">
      <div className="grid grid-cols-2 gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-mono border-b border-[hsl(var(--border))]">
        {cols.map((c) => <div key={c}>{c}</div>)}
      </div>
      <div className="divide-y divide-[hsl(var(--border))]">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 px-3 py-2 text-[12.5px] font-mono">
            <div>{r[keys[0]]}</div>
            <div className="text-muted-foreground">{r[keys[1]]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
