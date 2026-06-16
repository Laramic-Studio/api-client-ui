import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections, selectWorkspaceEnvironments } from "@/lib/store/selectors";
import { useMemo, useState } from "react";
import { Plus, Trash2, Copy, Check, Box, Globe, Folder } from "lucide-react";
import { ENV } from "@/constants/testIds";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

export default function Environments() {
  const envs = useAppStore(selectWorkspaceEnvironments);
  const collections = useAppStore(selectWorkspaceCollections);
  const create = useAppStore((s) => s.createEnvironment);
  const update = useAppStore((s) => s.updateEnvironment);
  const dup = useAppStore((s) => s.duplicateEnvironment);
  const del = useAppStore((s) => s.deleteEnvironment);
  const setActive = useAppStore((s) => s.setActiveEnvironment);

  const [scope, setScope] = useState("all"); // "all" | "workspace" | collectionId
  const filtered = useMemo(() => {
    if (scope === "all") return envs;
    if (scope === "workspace") return envs.filter((e) => !e.collectionId);
    return envs.filter((e) => e.collectionId === scope);
  }, [envs, scope]);

  const [selectedId, setSelectedId] = useState(filtered[0]?.id);
  const selected = filtered.find((e) => e.id === selectedId) || filtered[0];

  const updateVar = (idx, patch) => {
    if (!selected) return;
    const next = selected.variables.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    update(selected.id, { variables: next });
  };

  const createInScope = () => {
    const collectionId = scope !== "all" && scope !== "workspace" ? scope : null;
    const e = create({ name: collectionId ? "Collection Env" : "New Environment", collectionId });
    setSelectedId(e.id);
    toast.success(`Created ${e.name}`);
  };

  return (
    <div className="h-full overflow-hidden grid grid-cols-[320px_1fr]">
      <div className="border-r border-border flex flex-col">
        <div className="h-12 shrink-0 flex items-center px-3 border-b border-border gap-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Environments</div>
          <button
            onClick={createInScope}
            data-testid={ENV.newEnv}
            className="ml-auto h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            title="New environment"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-2 border-b border-border">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-8 bg-muted border-border text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All scopes</SelectItem>
              <SelectItem value="workspace">Workspace only</SelectItem>
              {collections.map((c) => (
                <SelectItem key={c.id} value={c.id}>↳ {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">
              No environments in this scope.
            </div>
          )}
          {filtered.map((e) => {
            const col = collections.find((c) => c.id === e.collectionId);
            return (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                data-testid={ENV.envItem(e.id)}
                className={cn(
                  "w-full flex items-center gap-2 h-10 px-2 rounded text-[13px] hover:bg-accent/50",
                  selectedId === e.id && "bg-accent text-foreground"
                )}
              >
                {col ? <Folder className="h-3.5 w-3.5 text-[hsl(var(--warning))]" /> : <Globe className="h-3.5 w-3.5 text-[hsl(var(--brand))]" />}
                <div className="flex-1 min-w-0 text-left">
                  <div className="truncate">{e.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider truncate">
                    {col ? col.name : "Workspace"}
                  </div>
                </div>
                {e.active && <span className="text-[10px] font-mono uppercase text-[hsl(var(--brand))]">Active</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col">
        {selected ? (
          <>
            <div className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-border">
              <Box className={cn("h-4 w-4", selected.active ? "text-[hsl(var(--brand))]" : "text-muted-foreground")} />
              <input
                value={selected.name}
                onChange={(e) => update(selected.id, { name: e.target.value })}
                className="bg-transparent text-[15px] font-medium outline-none"
              />
              <Select
                value={selected.collectionId || "__ws__"}
                onValueChange={(v) => update(selected.id, { collectionId: v === "__ws__" ? null : v })}
              >
                <SelectTrigger className="h-8 w-56 bg-muted border-border text-[12px] ml-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="__ws__">Workspace-wide</SelectItem>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>Scoped to: {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-1">
                {!selected.active && (
                  <button
                    onClick={() => { setActive(selected.id); toast.success(`Activated ${selected.name}`); }}
                    className="h-8 px-2.5 rounded-md border border-border text-[12.5px] hover:bg-accent/50 inline-flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" /> Activate
                  </button>
                )}
                <button
                  onClick={() => dup(selected.id)}
                  className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { if (envs.length > 1) { del(selected.id); setSelectedId(envs.find((e) => e.id !== selected.id)?.id); toast.success("Deleted"); } }}
                  className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="rounded-md border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-[24px_1fr_1fr_28px] gap-1 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-mono border-b border-border">
                  <div></div>
                  <div>Variable</div>
                  <div>Value</div>
                  <div></div>
                </div>
                {selected.variables.map((v, i) => (
                  <div key={i} className="grid grid-cols-[24px_1fr_1fr_28px] gap-1 px-3 py-1.5 items-center border-b border-border last:border-b-0">
                    <input
                      type="checkbox"
                      checked={v.enabled !== false}
                      onChange={(e) => updateVar(i, { enabled: e.target.checked })}
                      className="accent-[hsl(var(--brand))] mx-auto"
                    />
                    <input
                      value={v.key}
                      onChange={(e) => updateVar(i, { key: e.target.value })}
                      className="h-8 px-2 rounded bg-muted border border-border text-[12.5px] font-mono"
                    />
                    <input
                      value={v.value}
                      onChange={(e) => updateVar(i, { value: e.target.value })}
                      className="h-8 px-2 rounded bg-muted border border-border text-[12.5px] font-mono"
                    />
                    <button
                      onClick={() => update(selected.id, { variables: selected.variables.filter((_, idx) => idx !== i) })}
                      className="h-8 w-8 grid place-items-center rounded text-muted-foreground hover:text-[hsl(var(--danger))] hover:bg-accent/50"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => update(selected.id, { variables: [...selected.variables, { key: "", value: "", enabled: true }] })}
                  data-testid={ENV.varAdd}
                  className="w-full text-left px-3 py-2 text-[12.5px] text-muted-foreground hover:bg-accent/50 inline-flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Add variable
                </button>
              </div>

              <div className="mt-6 rounded-md border border-border bg-card p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Scope & hierarchy</div>
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                  Workspace-wide environments are available to all collections in the active workspace.
                  Collection-scoped environments override variables of the same name for requests inside that collection.
                  Reference variables anywhere with <span className="font-mono text-[hsl(var(--brand))]">{"[[VAR_NAME]]"}</span> (legacy <span className="font-mono">{"{{VAR}}"}</span> is still supported).
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full grid place-items-center text-muted-foreground text-[13px]">
            Select an environment or create a new one in this scope.
          </div>
        )}
      </div>
    </div>
  );
}
