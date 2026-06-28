import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections, selectWorkspaceEnvironments } from "@/lib/store/selectors";
import ConduitEditor from "@/components/conduits/ConduitEditor";
import CreateConduitDialog from "@/components/conduits/CreateConduitDialog";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useBindAiTool } from "@/providers/AiContextProvider";
import { createConduitAiBindings } from "@/ai-tools/conduit-bindings";
import { summarizeConduitStepForAi } from "@/lib/ai/snapshot";
import { resolveBuilderOpenRequest } from "@/lib/conduits/ai-utils";
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
import ReadOnlyWorkspaceBanner from "@/components/shared/ReadOnlyWorkspaceBanner";
import { useWorkspaceWriteAccess } from "@/hooks/use-team-permissions";
import { Plus, Workflow, Loader2, Lock, Users, UserCheck, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const VISIBILITY_META = {
  private: { label: "Private", icon: Lock },
  team: { label: "Workspace", icon: Users },
  shared: { label: "Restricted", icon: UserCheck },
};

export default function Conduits() {
  useCollections();
  useEnvironments();
  const { conduitId } = useParams();
  const navigate = useNavigate();
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();
  const { data: conduits = [], isLoading } = useConduits();
  const createConduit = useCreateConduit();
  const deleteConduit = useDeleteConduit();
  const savePatch = useDebouncedConduitUpdate(700);
  const { isReadOnly, notifyReadOnly } = useWorkspaceWriteAccess();

  const collections = useAppStore(selectWorkspaceCollections);
  const envs = useAppStore(selectWorkspaceEnvironments);
  const activeEnv = useAppStore((s) => s.getActiveEnvironment());

  const [activeId, setActiveId] = useState(null);
  const [selectedEnvId, setSelectedEnvId] = useState(activeEnv?.id || "");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const selectedEnv = useMemo(
    () => envs.find((e) => e.id === selectedEnvId) || activeEnv || envs[0],
    [envs, selectedEnvId, activeEnv],
  );

  const activeConduit = conduits.find((c) => c.id === activeId);

  useEffect(() => {
    if (!conduits.length) return;
    if (conduitId && conduits.some((c) => c.id === conduitId)) {
      setActiveId(conduitId);
    } else if (!conduitId) {
      setActiveId(null);
    }
  }, [conduitId, conduits]);

  const activeConduitRef = useRef(null);
  const patchConduitRef = useRef(null);
  const selectedEnvRef = useRef(null);
  const conduitsRef = useRef(conduits);
  const editorActionsRef = useRef(null);
  const setSelectedEnvIdRef = useRef(setSelectedEnvId);
  setSelectedEnvIdRef.current = setSelectedEnvId;

  const patchConduit = (id, patch) => {
    if (isReadOnly) {
      notifyReadOnly();
      return;
    }
    let snapshot = null;
    queryClient.setQueryData(conduitKeys.list(teamId), (old) => {
      const next = (old || []).map((c) => {
        if (c.id !== id) return c;
        const merged = {
          ...c,
          ...patch,
          steps: patch.steps ?? c.steps,
          layout: patch.layout ?? c.layout,
        };
        snapshot = merged;
        return merged;
      });
      return next;
    });
    if (snapshot) {
      savePatch(id, {
        name: snapshot.name,
        visibility: snapshot.visibility,
        sharedWith: snapshot.sharedWith,
        layout: snapshot.layout,
        steps: snapshot.steps,
      });
    }
  };

  activeConduitRef.current = activeConduit;
  patchConduitRef.current = patchConduit;
  selectedEnvRef.current = selectedEnv;
  conduitsRef.current = conduits;

  useBindAiTool("conduits", {
    getSnapshot: () => {
      const conduit = activeConduitRef.current;
      if (conduit) {
        const selectedStepId = editorActionsRef.current?.getSelectedStepId?.() ?? null;
        const selectedStep = selectedStepId
          ? conduit.steps.find((s) => s.id === selectedStepId)
          : null;
        const builderRequest = resolveBuilderOpenRequest();

        return {
          view: "editor",
          conduit: {
            id: conduit.id,
            name: conduit.name,
            visibility: conduit.visibility || "private",
            sharedWith: conduit.sharedWith || [],
            canEdit: conduit.canEdit !== false,
            selectedEnvironmentId: selectedEnvRef.current?.id || null,
            selectedEnvironmentName: selectedEnvRef.current?.name || null,
            selectedStepId,
            selectedStep: selectedStep
              ? summarizeConduitStepForAi(selectedStep, { selected: true })
              : null,
            steps: conduit.steps.map((s) => summarizeConduitStepForAi(s, {
              selected: s.id === selectedStepId,
            })),
            edges: (conduit.layout?.edges || []).map((edge) => ({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              sourceName: conduit.steps.find((s) => s.id === edge.source)?.name || null,
              targetName: conduit.steps.find((s) => s.id === edge.target)?.name || null,
            })),
          },
          builderOpenRequest: builderRequest
            ? {
              id: builderRequest.id,
              name: builderRequest.name,
              method: builderRequest.method,
              url: builderRequest.url,
            }
            : null,
          environments: envs.map((e) => ({ id: e.id, name: e.name })),
          hints: {
            updateStep: "When user edits a step field, use conduit.update_step with patch.set_param / patch.url on selectedStep (no step_id needed).",
            connectSteps: "Use step names in connect_to or connect_steps — do not ask for UUIDs.",
            addCurrentRequest: 'Use conduit.add_step_from_request with use_current_request:true and connect_to:"step name".',
          },
        };
      }

      return {
        view: "list",
        conduits: (conduitsRef.current || []).map((c) => ({
          id: c.id,
          name: c.name,
          visibility: c.visibility || "private",
          stepCount: c.steps.length,
          edgeCount: c.layout?.edges?.length || 0,
        })),
      };
    },
    bindings: createConduitAiBindings({
      getConduit: () => activeConduitRef.current,
      patchConduit: (id, patch) => patchConduitRef.current(id, patch),
      setSelectedEnvId: (id) => setSelectedEnvIdRef.current(id),
      getEditorActions: () => editorActionsRef.current,
      navigate,
      createConduit: (payload) => new Promise((resolve, reject) => {
        createConduit.mutate(payload, {
          onSuccess: (data) => resolve(data),
          onError: (err) => reject(new Error(getErrorMessage(err, "Could not create conduit."))),
        });
      }),
    }),
  });

  const handleCreate = (payload) => {
    if (isReadOnly) {
      notifyReadOnly();
      return;
    }
    createConduit.mutate(payload, {
      onSuccess: (created) => {
        toast.success("Conduit created");
        setShowCreateDialog(false);
        navigate(`/conduits/${created.id}`);
      },
      onError: (err) => toast.error(getErrorMessage(err, "Could not create conduit.")),
    });
  };

  if (isLoading && conduits.length === 0) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-[13px]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading conduits…
      </div>
    );
  }

  if (activeConduit) {
    return (
      <ConduitEditor
        conduit={activeConduit}
        onPatch={patchConduit}
        onBack={() => navigate("/conduits")}
        collections={collections}
        envs={envs}
        selectedEnv={selectedEnv}
        onEnvChange={setSelectedEnvId}
        editorActionsRef={editorActionsRef}
        workspaceReadOnly={isReadOnly}
      />
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <ReadOnlyWorkspaceBanner className="mb-5" />
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// chaining</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Request Conduits</h1>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-xl">
            Build visual API workflows on a canvas — edit each step, extract data, and pass it to the next request.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isReadOnly) {
              notifyReadOnly();
              return;
            }
            setShowCreateDialog(true);
          }}
          disabled={createConduit.isPending || isReadOnly}
          className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-60"
        >
          {createConduit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          New conduit
        </button>
      </div>

      {conduits.length === 0 ? (
        <div className="flex-1 rounded-md border border-dashed border-border grid place-items-center text-[13px] text-muted-foreground">
          <div className="text-center space-y-3">
            <p>No conduits yet. Create one to start chaining requests.</p>
            <button
              type="button"
              onClick={() => {
                if (isReadOnly) {
                  notifyReadOnly();
                  return;
                }
                setShowCreateDialog(true);
              }}
              disabled={isReadOnly}
              className="h-8 px-3 rounded-md border border-border hover:bg-accent/50 text-[12px] inline-flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> New conduit
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {conduits.map((c) => {
            const vis = VISIBILITY_META[c.visibility] || VISIBILITY_META.private;
            const VisIcon = vis.icon;
            return (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/conduits/${c.id}`)}
              className={cn(
                "text-left rounded-md border border-border bg-card p-4 hover:border-[hsl(var(--brand))]/50 hover:bg-accent/20 transition-colors",
              )}
            >
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-[hsl(var(--brand))] shrink-0" />
                <span className="text-[14px] font-medium truncate flex-1">{c.name}</span>
                {c.canEdit === false && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                    <Eye className="h-3 w-3" /> View
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <VisIcon className="h-3 w-3" />
                  {vis.label}
                </span>
                <span>·</span>
                <span>
                  {c.steps.length} step{c.steps.length === 1 ? "" : "s"}
                  {(c.layout?.edges?.length || 0) > 0 && ` · ${c.layout.edges.length} connection${c.layout.edges.length > 1 ? "s" : ""}`}
                </span>
              </div>
            </button>
            );
          })}
        </div>
      )}

      <CreateConduitDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreate}
        loading={createConduit.isPending}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete conduit"
        description={deleteTarget ? `Delete "${deleteTarget.name}"?` : ""}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteConduit.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Conduit deleted");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Could not delete conduit.")),
          });
        }}
        loading={deleteConduit.isPending}
      />
    </div>
  );
}
