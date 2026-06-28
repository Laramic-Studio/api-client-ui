import { useState, useEffect, useCallback } from "react";
import ConduitCanvas from "@/components/conduits/ConduitCanvas";
import ConduitStepEditor from "@/components/conduits/ConduitStepEditor";
import ConduitRunPanel from "@/components/conduits/ConduitRunPanel";
import ImportFromCollection from "@/components/conduits/ImportFromCollection";
import ConduitVisibilityPicker from "@/components/conduits/ConduitVisibilityPicker";
import { useAppStore } from "@/store/useAppStore";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRunForApi, runConduit } from "@/lib/conduits/executor";
import { createEmptyStep } from "@/lib/conduits/step-utils";
import { requestToConduitStep } from "@/lib/api/map-conduit";
import { useConduitRuns, useStoreConduitRun } from "@/hooks/use-conduits";
import { getErrorMessage } from "@/hooks/use-auth";
import { ArrowLeft, GitBranch, Loader2, Play, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ConduitEditor({
  conduit,
  onPatch,
  onBack,
  collections,
  selectedEnv,
  envs,
  onEnvChange,
  editorActionsRef,
  workspaceReadOnly = false,
}) {
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [connectMode, setConnectMode] = useState(false);
  const [liveResult, setLiveResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);

  const canEdit = conduit.canEdit !== false && !workspaceReadOnly;
  const { data: runs = [] } = useConduitRuns(conduit.id);
  const storeRun = useStoreConduitRun(conduit.id);

  useEffect(() => {
    const pending = useAppStore.getState().aiConduitRunResult;
    if (pending?.conduitId === conduit.id && pending.result) {
      setLiveResult(pending.result);
      setSelectedRun(null);
      useAppStore.getState().clearAiConduitRunResult();
    }
  }, [conduit.id]);

  const selectedStep = conduit.steps.find((s) => s.id === selectedStepId) || null;

  const patch = (p) => {
    if (!canEdit) return;
    onPatch(conduit.id, p);
  };

  const updateStep = (step) => {
    patch({ steps: conduit.steps.map((s) => (s.id === step.id ? step : s)) });
  };

  const moveStep = (id, position) => {
    patch({ steps: conduit.steps.map((s) => (s.id === id ? { ...s, position } : s)) });
  };

  const addStep = useCallback((name) => {
    const id = crypto.randomUUID();
    const step = {
      ...createEmptyStep(conduit.steps.length),
      id,
      ...(name ? { name } : {}),
    };
    patch({ steps: [...conduit.steps, step] });
    setSelectedStepId(id);
    return id;
  }, [conduit.steps, patch]);

  const importRequest = (request) => {
    const id = crypto.randomUUID();
    const step = { ...requestToConduitStep(request, conduit.steps.length), id };
    patch({ steps: [...conduit.steps, step] });
    setSelectedStepId(id);
    toast.success(`Added "${request.name}"`);
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
    patch({ layout: { edges: [...edges, { id: crypto.randomUUID(), source, target }] } });
  };

  const deleteEdge = (edgeId) => {
    patch({ layout: { edges: (conduit.layout?.edges || []).filter((e) => e.id !== edgeId) } });
  };

  const setEdges = useCallback((edges) => {
    patch({ layout: { edges } });
  }, [patch]);

  const updateStepById = useCallback((stepId, stepPatch) => {
    const step = conduit.steps.find((s) => s.id === stepId);
    if (!step) return;
    updateStep({ ...step, ...stepPatch });
  }, [conduit.steps, updateStep]);

  useEffect(() => {
    if (!editorActionsRef) return undefined;
    editorActionsRef.current = {
      getSelectedStepId: () => selectedStepId,
      selectStep: setSelectedStepId,
      addEmptyStep: (name) => addStep(name),
      deleteStep,
      connect,
      moveStep,
      updateStep: updateStepById,
      setEdges,
    };
    return () => {
      if (editorActionsRef.current) editorActionsRef.current = null;
    };
  }, [
    editorActionsRef,
    selectedStepId,
    addStep,
    deleteStep,
    connect,
    moveStep,
    updateStepById,
    setEdges,
  ]);

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
      storeRun.mutate(formatRunForApi(result, selectedEnv?.id), {
        onError: (err) => toast.error(getErrorMessage(err, "Run completed but could not save history.")),
      });
      toast[result.success ? "success" : "error"](
        result.success
          ? `Flow completed (${result.steps.length} steps)`
          : `Flow stopped at step ${result.steps.length}`,
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not run conduit."));
    } finally {
      setRunning(false);
    }
  };

  const displayResult = liveResult || selectedRun;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="min-h-12 shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border">
        <button type="button" onClick={onBack} className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent/50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <input
          value={conduit.name}
          onChange={(e) => patch({ name: e.target.value })}
          readOnly={!canEdit}
          className={cn(
            "bg-transparent text-[14px] font-medium outline-none flex-1 min-w-0",
            !canEdit && "text-muted-foreground",
          )}
        />
        {canEdit ? (
          <ConduitVisibilityPicker
            visibility={conduit.visibility || "private"}
            sharedWith={conduit.sharedWith || []}
            onChange={({ visibility, sharedWith }) => patch({ visibility, sharedWith })}
          />
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-2">
            <Eye className="h-3.5 w-3.5" /> View only
          </div>
        )}
        {envs.length > 0 && (
          <Select value={selectedEnv?.id || ""} onValueChange={onEnvChange}>
            <SelectTrigger className="h-8 w-[150px] text-[12px]">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              {envs.map((e) => (
                <SelectItem key={e.id} value={e.id} className="text-[12px]">{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {canEdit && (
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
        )}
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
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <ResizablePanelGroup direction="vertical" className="h-full min-h-0">
            <ResizablePanel defaultSize={38} minSize={15} maxSize={75} className="min-h-0">
              <ConduitCanvas
                steps={conduit.steps}
                layout={conduit.layout}
                selectedStepId={selectedStepId}
                connectMode={connectMode && canEdit}
                onSelectStep={setSelectedStepId}
                onMoveStep={canEdit ? moveStep : () => {}}
                onConnect={canEdit ? connect : () => {}}
                onDeleteEdge={canEdit ? deleteEdge : () => {}}
                onAddStep={canEdit ? addStep : () => {}}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={62} minSize={25} className="min-h-0">
              <div className="h-full overflow-y-auto">
                <div className="px-3 py-3 flex flex-col gap-5">
                  {canEdit && (
                    <ImportFromCollection collections={collections} onImport={importRequest} />
                  )}
                  <div className="min-h-[280px] shrink-0">
                    <ConduitRunPanel
                      result={displayResult}
                      runs={runs}
                      onSelectRun={setSelectedRun}
                    />
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <div className="w-[340px] shrink-0 min-h-0 border-l border-border">
          <ConduitStepEditor
            step={selectedStep}
            allSteps={conduit.steps}
            selectedEnv={selectedEnv}
            onChange={updateStep}
            onClose={() => setSelectedStepId(null)}
            onDelete={() => selectedStep && deleteStep(selectedStep.id)}
            readOnly={!canEdit}
          />
        </div>
      </div>
    </div>
  );
}
