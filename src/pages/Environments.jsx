import EnvironmentVariablesTable from "@/components/environments/EnvironmentVariablesTable";
import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections, selectWorkspaceEnvironments } from "@/lib/store/selectors";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2, Copy, Check, Box, Globe, Folder, Plus } from "lucide-react";
import { ENV } from "@/constants/testIds";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { getErrorMessage } from "@/hooks/use-auth";
import {
  useActivateEnvironment,
  useCreateEnvironment,
  useDebouncedEnvironmentUpdate,
  useDeleteEnvironment,
  useDuplicateEnvironment,
  useEnvironments,
} from "@/hooks/use-environments";

export default function Environments() {
  const envs = useAppStore(selectWorkspaceEnvironments);
  const collections = useAppStore(selectWorkspaceCollections);
  const updateLocal = useAppStore((s) => s.updateEnvironment);
  const { isLoading } = useEnvironments();
  const createEnv = useCreateEnvironment();
  const deleteEnv = useDeleteEnvironment();
  const duplicateEnv = useDuplicateEnvironment();
  const activateEnv = useActivateEnvironment();
  const savePatch = useDebouncedEnvironmentUpdate(700);

  const [scope, setScope] = useState("all");
  const filtered = useMemo(() => {
    if (scope === "all") return envs;
    if (scope === "workspace") return envs.filter((e) => !e.collectionId);
    return envs.filter((e) => e.collectionId === scope);
  }, [envs, scope]);

  const [selectedId, setSelectedId] = useState(filtered[0]?.id);
  const selected = filtered.find((e) => e.id === selectedId) || filtered[0];

  useEffect(() => {
    if (!filtered.some((e) => e.id === selectedId)) {
      setSelectedId(filtered[0]?.id);
    }
  }, [filtered, selectedId]);

  const patchEnvironment = (id, patch) => {
    updateLocal(id, patch);
    savePatch(id, patch);
  };

  const updateVar = (idx, patch) => {
    if (!selected) return;
    const next = selected.variables.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    patchEnvironment(selected.id, { variables: next });
  };

  const createInScope = () => {
    const collectionId = scope !== "all" && scope !== "workspace" ? scope : null;
    createEnv.mutate(
      {
        name: collectionId ? "Collection Env" : "New Environment",
        collection_id: collectionId,
      },
      {
        onSuccess: (data) => {
          setSelectedId(data.environment.id);
          toast.success(`Created ${data.environment.name}`);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Could not create environment.")),
      },
    );
  };

  if (isLoading && envs.length === 0) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-[13px]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading environments…
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden grid grid-cols-[320px_1fr]">
      <div className="border-r border-border flex flex-col">
        <div className="h-12 shrink-0 flex items-center px-3 border-b border-border gap-2">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Environments</div>
          <button
            onClick={createInScope}
            disabled={createEnv.isPending}
            data-testid={ENV.newEnv}
            className="ml-auto h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="New environment"
          >
            {createEnv.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
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
                  selectedId === e.id && "bg-accent text-foreground",
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
                onChange={(e) => patchEnvironment(selected.id, { name: e.target.value })}
                className="bg-transparent text-[15px] font-medium outline-none"
              />
              <Select
                value={selected.collectionId || "__ws__"}
                onValueChange={(v) => patchEnvironment(selected.id, { collectionId: v === "__ws__" ? null : v })}
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
                    onClick={() => {
                      activateEnv.mutate(selected.id, {
                        onSuccess: () => toast.success(`Activated ${selected.name}`),
                        onError: (err) => toast.error(getErrorMessage(err, "Could not activate environment.")),
                      });
                    }}
                    disabled={activateEnv.isPending}
                    className="h-8 px-2.5 rounded-md border border-border text-[12.5px] hover:bg-accent/50 inline-flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {activateEnv.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {activateEnv.isPending ? "Activating…" : "Activate"}
                  </button>
                )}
                <button
                  onClick={() => {
                    duplicateEnv.mutate(selected.id, {
                      onSuccess: (data) => {
                        setSelectedId(data.environment.id);
                        toast.success("Environment duplicated");
                      },
                      onError: (err) => toast.error(getErrorMessage(err, "Could not duplicate environment.")),
                    });
                  }}
                  disabled={duplicateEnv.isPending}
                  className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {duplicateEnv.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => {
                    if (envs.length <= 1) return;
                    deleteEnv.mutate(selected.id, {
                      onSuccess: () => {
                        setSelectedId(envs.find((e) => e.id !== selected.id)?.id);
                        toast.success("Deleted");
                      },
                      onError: (err) => toast.error(getErrorMessage(err, "Could not delete environment.")),
                    });
                  }}
                  disabled={deleteEnv.isPending || envs.length <= 1}
                  className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))] disabled:opacity-50"
                >
                  {deleteEnv.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <EnvironmentVariablesTable
                variables={selected.variables}
                onUpdate={updateVar}
                onRemove={(idx) => patchEnvironment(selected.id, {
                  variables: selected.variables.filter((_, i) => i !== idx),
                })}
                onAdd={() => patchEnvironment(selected.id, {
                  variables: [...selected.variables, { key: "", value: "", enabled: true, secret: false }],
                })}
              />

              <div className="mt-6 rounded-md border border-border bg-card p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Scope & hierarchy</div>
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                  Workspace-wide environments are available to all collections in the active workspace.
                  Collection-scoped environments override variables of the same name for requests inside that collection.
                  Mark sensitive values as <span className="font-mono text-foreground/85">secret</span> — they are encrypted in the cloud and masked in the UI.
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
