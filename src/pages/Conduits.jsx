import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections, selectWorkspaceEnvironments } from "@/lib/store/selectors";
import { requestToConduitStep } from "@/lib/api/map-conduit";
import { runConduit } from "@/lib/conduits/executor";
import ConduitStepCard, { ConduitRunResults } from "@/components/conduits/ConduitStepCard";
import MethodBadge from "@/components/shared/MethodBadge";
import {
  useConduits,
  useCreateConduit,
  useDebouncedConduitUpdate,
  useDeleteConduit,
  useActiveTeamId,
} from "@/hooks/use-conduits";
import { conduitKeys } from "@/lib/api/query-keys";
import { useCollections } from "@/hooks/use-collections";
import { useEnvironments } from "@/hooks/use-environments";
import { getErrorMessage } from "@/hooks/use-auth";
import { Plus, Workflow, ArrowRight, Play, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function Conduits() {
  useCollections();
  useEnvironments();
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();
  const { data: conduits = [], isLoading } = useConduits();
  const createConduit = useCreateConduit();
  const deleteConduit = useDeleteConduit();
  const savePatch = useDebouncedConduitUpdate(700);

  const collections = useAppStore(selectWorkspaceCollections);
  const envs = useAppStore(selectWorkspaceEnvironments);
  const activeEnv = useAppStore((s) => s.getActiveEnvironment());

  const [selectedEnvId, setSelectedEnvId] = useState(activeEnv?.id || "");
  const [runningId, setRunningId] = useState(null);
  const [runResults, setRunResults] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const selectedEnv = useMemo(
    () => envs.find((e) => e.id === selectedEnvId) || activeEnv || envs[0],
    [envs, selectedEnvId, activeEnv],
  );

  const allRequests = useMemo(
    () =>
      collections.flatMap((c) =>
        c.requests.map((r) => ({ ...r, collectionName: c.name })),
      ),
    [collections],
  );

  const patchConduit = (id, patch) => {
    queryClient.setQueryData(conduitKeys.list(teamId), (old) =>
      (old || []).map((c) =>
        c.id === id ? { ...c, ...patch, steps: patch.steps ?? c.steps } : c,
      ),
    );
    savePatch(id, patch);
  };

  const handleCreate = () => {
    createConduit.mutate(
      { name: "Untitled conduit", steps: [] },
      {
        onSuccess: () => toast.success("Conduit created"),
        onError: (err) => toast.error(getErrorMessage(err, "Could not create conduit.")),
      },
    );
  };

  const handleDelete = (conduit) => {
    setDeleteTarget(conduit);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteConduit.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Conduit deleted");
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(getErrorMessage(err, "Could not delete conduit.")),
    });
  };

  const addStep = (conduitId, request) => {
    const conduit = conduits.find((c) => c.id === conduitId);
    if (!conduit) return;
    const step = requestToConduitStep(request);
    patchConduit(conduitId, { steps: [...conduit.steps, step] });
  };

  const updateStep = (conduitId, stepIndex, patch) => {
    const conduit = conduits.find((c) => c.id === conduitId);
    if (!conduit) return;
    const steps = conduit.steps.map((s, i) => (i === stepIndex ? { ...s, ...patch } : s));
    patchConduit(conduitId, { steps });
  };

  const removeStep = (conduitId, stepIndex) => {
    const conduit = conduits.find((c) => c.id === conduitId);
    if (!conduit) return;
    patchConduit(conduitId, { steps: conduit.steps.filter((_, i) => i !== stepIndex) });
  };

  const handleRun = async (conduit) => {
    if (!conduit.steps.length) {
      toast.error("Add at least one step before running.");
      return;
    }
    setRunningId(conduit.id);
    setRunResults((r) => ({ ...r, [conduit.id]: null }));
    try {
      const result = await runConduit({
        steps: conduit.steps,
        env: selectedEnv,
        mode: "real",
      });
      setRunResults((r) => ({ ...r, [conduit.id]: result }));
      if (result.success) {
        toast.success(`"${conduit.name}" completed (${result.steps.length} steps)`);
      } else {
        toast.error(`"${conduit.name}" stopped at step ${result.steps.length}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not run conduit."));
    } finally {
      setRunningId(null);
    }
  };

  if (isLoading && conduits.length === 0) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-[13px]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading conduits…
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// chaining</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Request Conduits</h1>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-xl">
            Chain requests without writing code — extract values from each response and pass them to the next step.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {envs.length > 0 && (
            <select
              value={selectedEnv?.id || ""}
              onChange={(e) => setSelectedEnvId(e.target.value)}
              className="h-9 px-2.5 rounded-md border border-border bg-background text-[12.5px] outline-none"
            >
              {envs.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={createConduit.isPending}
            className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-60"
          >
            {createConduit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            New conduit
          </button>
        </div>
      </div>

      {conduits.length === 0 && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-[13px] text-muted-foreground">
          No conduits yet. Create one to chain API requests visually.
        </div>
      )}

      {conduits.map((c) => (
        <div key={c.id} className="rounded-md border border-border bg-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-[hsl(var(--brand))]" />
            <input
              value={c.name}
              onChange={(e) => patchConduit(c.id, { name: e.target.value })}
              className="bg-transparent text-[14px] font-medium outline-none flex-1 min-w-0"
            />
            <button
              type="button"
              onClick={() => handleRun(c)}
              disabled={runningId === c.id}
              className={cn(
                "h-8 px-2.5 rounded-md border border-border hover:bg-accent/50 inline-flex items-center gap-1.5 text-[12.5px]",
                runningId === c.id && "opacity-60",
              )}
            >
              {runningId === c.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Run flow
            </button>
            <button
              type="button"
              onClick={() => handleDelete(c)}
              disabled={deleteConduit.isPending}
              className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="flex items-stretch gap-3 min-w-max pb-1">
              {c.steps.map((step, idx) => (
                <div key={step.id || idx} className="flex items-center gap-3">
                  <ConduitStepCard
                    step={step}
                    onExtractChange={(extract) => updateStep(c.id, idx, { extract })}
                    onRemove={() => removeStep(c.id, idx)}
                  />
                  {idx < c.steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground/70 shrink-0" />}
                </div>
              ))}
              {c.steps.length === 0 && (
                <div className="text-[12.5px] text-muted-foreground">Empty conduit. Append a request below.</div>
              )}
            </div>
          </div>

          {runResults[c.id] && (
            <ConduitRunResults
              result={runResults[c.id]}
              onClose={() => setRunResults((r) => ({ ...r, [c.id]: null }))}
            />
          )}

          <div className="border-t border-border pt-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2">
              Append step from collection
            </div>
            {allRequests.length === 0 ? (
              <div className="text-[12px] text-muted-foreground">No saved requests yet. Create some in the API Builder.</div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-auto">
                {allRequests.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => addStep(c.id, r)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border hover:bg-accent/50 text-[12px]"
                    title={r.collectionName}
                  >
                    <MethodBadge method={r.method} />
                    <span className="truncate max-w-[160px]">{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete conduit"
        description={deleteTarget ? `Delete "${deleteTarget.name}"?` : ""}
        onConfirm={confirmDelete}
        loading={deleteConduit.isPending}
      />
    </div>
  );
}
