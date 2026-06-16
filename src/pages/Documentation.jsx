import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections } from "@/lib/store/selectors";
import MethodBadge from "@/components/shared/MethodBadge";
import { BookOpenText, Search, Copy, Link as LinkIcon, KeyRound, Share2, Globe } from "lucide-react";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";

export default function Documentation() {
  const collections = useAppStore(selectWorkspaceCollections);
  const activeWs = useAppStore((s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId));
  const createShareLink = useAppStore((s) => s.createShareLink);
  const revokeShareLink = useAppStore((s) => s.revokeShareLink);
  const shareLinks = useAppStore((s) => s.shareLinks);
  const [activeColId, setActiveColId] = useState(collections[0]?.id);
  const [activeReqId, setActiveReqId] = useState(collections[0]?.requests[0]?.id);
  const [q, setQ] = useState("");

  const filteredCols = useMemo(() => {
    if (!q) return collections;
    return collections.filter((c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.requests.some((r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.url.toLowerCase().includes(q.toLowerCase()))
    );
  }, [collections, q]);

  const activeCol = collections.find((c) => c.id === activeColId);
  const activeReq = activeCol?.requests.find((r) => r.id === activeReqId);
  const shareId = activeCol ? shareLinks[activeCol.id] : null;
  const shareUrl = shareId ? `${window.location.origin}/p/docs/${shareId}` : null;

  const onShare = () => {
    if (!activeCol) return;
    const sid = createShareLink(activeCol.id);
    const url = `${window.location.origin}/p/docs/${sid}`;
    navigator.clipboard?.writeText(url);
    toast.success("Public docs link copied");
  };
  const onRevoke = () => {
    if (!activeCol) return;
    revokeShareLink(activeCol.id);
    toast.success("Public docs link revoked");
  };

  const exampleResp = {
    success: true,
    message: `${activeReq?.method || "GET"} response`,
    data: { id: 1, ref: "abc123", createdAt: new Date().toISOString() },
  };

  return (
    <div className="h-full overflow-hidden grid grid-cols-[280px_1fr]">
      <div className="border-r border-border flex flex-col">
        <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-border">
          <BookOpenText className="h-4 w-4 text-muted-foreground" />
          <div className="text-[13px] font-medium">Docs</div>
        </div>
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find endpoint" className="w-full h-8 pl-8 pr-2 rounded-md bg-muted border border-border text-[12px] placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {filteredCols.map((c) => (
            <div key={c.id} className="mb-2">
              <button
                onClick={() => setActiveColId(c.id)}
                className="w-full text-left px-2 py-1.5 text-[11px] uppercase tracking-wider font-mono text-muted-foreground hover:text-foreground"
              >
                {c.name}
              </button>
              {c.requests.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setActiveColId(c.id); setActiveReqId(r.id); }}
                  className={`w-full flex items-center gap-2 h-7 px-2 rounded text-[12px] hover:bg-accent/50 ${activeReqId === r.id ? "bg-accent text-foreground" : "text-muted-foreground"}`}
                >
                  <MethodBadge method={r.method} className="w-12 text-left" />
                  <span className="truncate">{r.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// documentation</div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-3xl font-medium tracking-tight">{activeWs?.name} API</h1>
            <div className="ml-auto flex items-center gap-2">
              {shareUrl && (
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 px-2.5 rounded-md border border-[hsl(var(--border))] hover:bg-accent/40 text-[12.5px] inline-flex items-center gap-1.5 text-muted-foreground"
                  data-testid="docs-share-open"
                >
                  <Globe className="h-3.5 w-3.5" /> Open public link
                </a>
              )}
              <button
                onClick={onShare}
                data-testid="docs-share-button"
                className="h-8 px-2.5 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white text-[12.5px] font-medium inline-flex items-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" /> {shareUrl ? "Copy link" : "Share publicly"}
              </button>
              {shareUrl && (
                <button
                  onClick={onRevoke}
                  className="h-8 px-2.5 rounded-md border border-[hsl(var(--border))] hover:bg-accent/40 text-[12.5px] text-muted-foreground"
                  data-testid="docs-share-revoke"
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-[13.5px] text-muted-foreground max-w-2xl">
            Auto-generated reference docs for your collection. Every request becomes a documented endpoint with examples and code snippets.
          </p>

          <div className="mt-6 rounded-md border border-border bg-card p-5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5" /> Authentication
            </div>
            <p className="mt-2 text-[13px] text-foreground/85">
              All endpoints require a bearer token. Pass the <span className="font-mono text-[hsl(var(--brand))]">Authorization: Bearer {"{{TOKEN}}"}</span> header. Tokens never expire; rotate them in <a href="/settings" className="text-[hsl(var(--brand))] hover:underline">Settings → Integrations</a>.
            </p>
          </div>

          {activeReq ? (
            <div className="mt-6 space-y-6">
              <div>
                <div className="flex items-center gap-3">
                  <MethodBadge method={activeReq.method} className="text-base" />
                  <code className="font-mono text-[14px] text-foreground">{activeReq.url}</code>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(activeReq.url); toast.success("URL copied"); }}
                    className="ml-auto h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { window.location.href = `/builder/${activeReq.id}`; }}
                    className="h-7 px-2.5 rounded text-[12px] border border-border hover:bg-accent/50 inline-flex items-center gap-1.5"
                  >
                    <LinkIcon className="h-3 w-3" /> Open in builder
                  </button>
                </div>
                <h2 className="mt-3 text-xl font-medium tracking-tight">{activeReq.name}</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">Endpoint within the {activeCol?.name} collection.</p>
              </div>

              <Section title="Request headers">
                <Table rows={activeReq.headers || []} cols={["Key", "Value"]} keys={["key", "value"]} />
              </Section>

              {(activeReq.params?.length ?? 0) > 0 && (
                <Section title="Query parameters">
                  <Table rows={activeReq.params} cols={["Name", "Example"]} keys={["key", "value"]} />
                </Section>
              )}

              <Section title="Example response — 200 OK">
                <div className="rounded-md border border-border overflow-hidden h-72">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={JSON.stringify(exampleResp, null, 2)}
                    theme="vs-dark"
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, fontFamily: "JetBrains Mono, monospace" }}
                  />
                </div>
              </Section>
            </div>
          ) : (
            <div className="mt-10 text-muted-foreground text-[13px]">Select an endpoint to view its documentation.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Table({ rows, cols, keys }) {
  if (!rows?.length) return <div className="text-[12.5px] text-muted-foreground">None.</div>;
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="grid grid-cols-2 gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-mono border-b border-border">
        {cols.map((c) => <div key={c}>{c}</div>)}
      </div>
      <div className="divide-y divide-border">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 px-3 py-2 text-[12.5px] font-mono">
            <div className="text-foreground/85">{r[keys[0]]}</div>
            <div className="text-muted-foreground">{r[keys[1]]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
