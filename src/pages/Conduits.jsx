import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import MethodBadge from "@/components/shared/MethodBadge";
import { Plus, Workflow, ArrowRight, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STARTER = [
  { id: "node1", name: "Login", method: "POST", url: "{{BASE_URL}}/auth/login", extract: "token" },
  { id: "node2", name: "Fetch profile", method: "GET", url: "{{BASE_URL}}/users/me", extract: "user.id" },
  { id: "node3", name: "List orders", method: "GET", url: "{{BASE_URL}}/orders?user={user.id}", extract: null },
];

export default function Conduits() {
  const [conduits, setConduits] = useState([{ id: "c1", name: "Auth → Profile → Orders", nodes: STARTER }]);
  const collections = useAppStore((s) => s.collectionsMap[s.activeWorkspaceId] || []);

  const newConduit = () => setConduits((c) => [...c, { id: `c${Date.now()}`, name: "Untitled conduit", nodes: [] }]);
  const addNode = (cid, fromReq) => {
    setConduits((cs) => cs.map((c) => c.id === cid ? {
      ...c,
      nodes: [...c.nodes, { id: `n${Date.now()}`, name: fromReq.name, method: fromReq.method, url: fromReq.url, extract: "" }],
    } : c));
  };
  const remove = (cid) => setConduits((cs) => cs.filter((c) => c.id !== cid));
  const run = (c) => {
    toast.success(`Running conduit "${c.name}" with ${c.nodes.length} steps`);
  };

  const sampleRequests = collections.flatMap((c) => c.requests.slice(0, 2)).slice(0, 6);

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// chaining</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Request Conduits</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Chain requests, extract variables from responses, and pass them to the next step.</p>
        </div>
        <button onClick={newConduit} className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" /> New conduit
        </button>
      </div>

      {conduits.map((c) => (
        <div key={c.id} className="rounded-md border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Workflow className="h-4 w-4 text-[hsl(var(--brand))]" />
            <input
              value={c.name}
              onChange={(e) => setConduits((cs) => cs.map((x) => x.id === c.id ? { ...x, name: e.target.value } : x))}
              className="bg-transparent text-[14px] font-medium outline-none"
            />
            <button onClick={() => run(c)} className="ml-auto h-8 px-2.5 rounded-md border border-border hover:bg-accent/50 inline-flex items-center gap-1.5 text-[12.5px]">
              <Play className="h-3.5 w-3.5" /> Run flow
            </button>
            <button onClick={() => remove(c.id)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))]">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="flex items-stretch gap-3 min-w-max pb-1">
              {c.nodes.map((n, idx) => (
                <div key={n.id} className="flex items-center gap-3">
                  <Node node={n} />
                  {idx < c.nodes.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground/70" />}
                </div>
              ))}
              {c.nodes.length === 0 && (
                <div className="text-[12.5px] text-muted-foreground">Empty conduit. Append a request below.</div>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Append step from existing requests</div>
            <div className="flex flex-wrap gap-2">
              {sampleRequests.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addNode(c.id, r)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border hover:bg-accent/50 text-[12px]"
                >
                  <MethodBadge method={r.method} />
                  <span>{r.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Node({ node }) {
  return (
    <div className={cn("min-w-[220px] rounded-md border bg-card border-border p-3")}>
      <div className="flex items-center gap-2">
        <MethodBadge method={node.method} />
        <span className="text-[12.5px] font-medium truncate">{node.name}</span>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground font-mono truncate">{node.url}</div>
      {node.extract && (
        <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[hsl(var(--brand))]/40 bg-[hsl(var(--brand))]/10 text-[10px] uppercase tracking-wider text-[hsl(var(--brand))] font-mono">
          extract → {node.extract}
        </div>
      )}
    </div>
  );
}
