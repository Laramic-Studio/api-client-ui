import { useState } from "react";
import ConduitCanvas from "@/components/conduits/ConduitCanvas";
import ConduitStepEditor from "@/components/conduits/ConduitStepEditor";
import ConduitRunPanel from "@/components/conduits/ConduitRunPanel";
import MethodBadge from "@/components/shared/MethodBadge";
import { formatRunForApi, runConduit } from "@/lib/conduits/executor";
import { createEmptyStep } from "@/lib/conduits/step-utils";
import { requestToConduitStep } from "@/lib/api/map-conduit";
import { useConduitRuns, useStoreConduitRun } from "@/hooks/use-conduits";
import { getErrorMessage } from "@/hooks/use-auth";
import { ArrowLeft, GitBranch, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ConduitEditor({
  conduit,
  onPatch,
  onBack,
  allRequests,
  selectedEnv,
  envs,
  onEnvChange,
}) {
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [connectMode, setConnectMode] = useState(false);
  const [liveResult, setLiveResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);

  const { data: runs = [] } = useConduitRuns(conduit.id);
  const storeRun = useStoreConduitRun(conduit.id);

  const selectedStep = conduit.steps.find((s) => s.id === selectedStepId) || null;

  const patch = (p) => onPatch(conduit.id, p);

  const updateStep = (step) => {
    patch({ steps: conduit.steps.map((s) => (s.id === step.id ? step : s)) });
  };

  const moveStep = (id, position) => {
    patch({
      steps: conduit.steps.map((s) => (s.id === id ? { ...s, position } : s)),
    });
  };

  const addStep = () => {
    const id = crypto.randomUUID();
    const step = { ...createEmptyStep(conduit.steps.length), id };
    patch({ steps: [...conduit.steps, step] });
    setSelectedStepId(id);
  };

  const importRequest = (request) => {
    const id = crypto.randomUUID();
    const step = { ...requestToConduitStep(request, conduit.steps.length), id };
    patch({ steps: [...conduit.steps, step] });
    setSelectedStepId(id);
  };

  const deleteStep = (id) => {
    patch({
      steps: conduit.steps.filter((s) => s.id !== id),
      layout: {
        edges: (conduit.layout?.edges || []).filter((e) => e.source !== id && e.target !== id),
      },
    });
    if (selectedStepId === id) setSelectedStepId(null);
  };

  const connect = (source, target) => {
    const edges = conduit.layout?.edges || [];
    if (edges.some((e) => e.source === source && e.target === target)) return;
    patch({
      layout: {
        edges: [...edges, { id: crypto.randomUUID(), source, target }],
      },
    });
  };

  const deleteEdge = (edgeId) => {
    patch({
      layout: {
        edges: (conduit.layout?.edges || []).filter((e) => e.id !== edgeId),
      },
    });
  };

  const handleRun = async () => {
    if (!conduit.steps.length) {
      toast.error("Add at least one step before running.");
      return;
    }
    setRunning(true);
    setLiveResult(null);
    setSelectedRun(null);
    try {
      const result = await runConduit({
        steps: conduit.steps,
        layout: conduit.layout,
        env: selectedEnv,
        mode: "real",
      });
      setLiveResult(result);
      const payload = formatRunForApi(result, selectedEnv?.id);
      storeRun.mutate(payload, {
        onError: (err) => toast.error(getErrorMessage(err, "Run completed but could not save history.")),
      });
      if (result.success) {
        toast.success(`Flow completed (${result.steps.length} steps)`);
      } else {
        toast.error(`Flow stopped at step ${result.steps.length}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not run conduit."));
    } finally {
      setRunning(false);
    }
  };

  const displayResult = liveResult || selectedRun;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-border">
        <button type="button" onClick={onBack} className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent/50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <input
          value={conduit.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="bg-transparent text-[14px] font-medium outline-none flex-1 min-w-0"
        />
        {envs.length > 0 && (
          <select
            value={selectedEnv?.id || ""}
            onChange={(e) => onEnvChange(e.target.value)}
            className="h-8 px-2 rounded-md border border-border bg-background text-[12px]"
          >
            {envs.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => setConnectMode((v) => !v)}
          className={cn(
            "h-8 px-2.5 rounded-md border text-[12px] inline-flex items-center gap-1.5",
            connectMode ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/10" : "border-border hover:bg-accent/50",
          )}
        >
          <GitBranch className="h-3.5 w-3.5" /> Connect
        </button>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="h-8 px-2.5 rounded-md bg-[hsl(var(--brand))] text-[12px] font-medium inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run
        </button>
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 flex flex-col p-3 gap-3">
          <ConduitCanvas
            steps={conduit.steps}
            layout={conduit.layout}
            selectedStepId={selectedStepId}
            connectMode={connectMode}
            onSelectStep={setSelectedStepId}
            onMoveStep={moveStep}
            onConnect={connect}
            onDeleteEdge={deleteEdge}
            onAddStep={addStep}
          />

          {allRequests.length > 0 && (
            <div className="shrink-0 border-t border-border pt-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5">
                Import from collection
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-auto">
                {allRequests.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => importRequest(r)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded border border-border hover:bg-accent/50 text-[11px]"
                    title={r.collectionName}
                  >
                    <MethodBadge method={r.method} />
                    <span className="truncate max-w-[120px]">{r.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <ConduitRunPanel
            result={displayResult}
            runs={runs}
            onSelectRun={setSelectedRun}
          />
        </div>

        <div className="w-[340px] shrink-0 min-h-0">
          <ConduitStepEditor
            step={selectedStep}
            onChange={updateStep}
            onClose={() => setSelectedStepId(null)}
            onDelete={() => selectedStep && deleteStep(selectedStep.id)}
          />
        </div>
      </div>
    </div>
  );
}
