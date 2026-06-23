import { requestToConduitStep } from "@/lib/api/map-conduit";
import {
  applyConduitStepPatch,
  connectStepsOnConduit,
  requireStepRef,
  resolveBuilderOpenRequest,
  resolveStepRef,
} from "@/lib/conduits/ai-utils";
import { createEmptyStep } from "@/lib/conduits/step-utils";
import { useAppStore } from "@/store/useAppStore";

const VISIBILITIES = new Set(["private", "team", "shared"]);

function requireEditableConduit(getConduit) {
  const conduit = getConduit();
  if (!conduit) throw new Error("Open a conduit in the editor first.");
  if (conduit.canEdit === false) throw new Error("This conduit is read-only.");
  return conduit;
}

function resolveStepId(conduit, payload, getEditorActions) {
  const selectedId = getEditorActions()?.getSelectedStepId?.() ?? null;
  const ref = payload?.step_id || payload?.step_ref || payload?.step_name || payload?.name;

  if (ref) {
    return requireStepRef(conduit, ref).id;
  }

  if (selectedId && conduit.steps.some((s) => s.id === selectedId)) {
    return selectedId;
  }

  throw new Error("step_id or step name is required — or select a step in the editor first.");
}

function resolveConnectRef(conduit, payload, keys) {
  for (const key of keys) {
    const value = payload?.[key];
    if (value) return requireStepRef(conduit, value).id;
  }
  return null;
}

/**
 * Runtime executors for conduit canvas/editor actions.
 * @param {{
 *   getConduit: () => object|null,
 *   patchConduit: (id: string, patch: object) => void,
 *   setSelectedEnvId?: (id: string) => void,
 *   getEditorActions?: () => object|null,
 *   createConduit?: (payload: object) => Promise<object>,
 *   navigate?: (path: string) => void,
 * }} ctx
 */
export function createConduitAiBindings(ctx) {
  const { getConduit, patchConduit, setSelectedEnvId, getEditorActions, createConduit, navigate } = ctx;

  return {
    "conduit.add_step_from_request": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      let requestId = payload?.request_id;

      if (!requestId && (payload?.use_current_request || payload?.use_builder_request)) {
        const open = resolveBuilderOpenRequest();
        if (!open?.id) throw new Error("No saved request open in the API builder.");
        requestId = open.id;
      }

      if (!requestId) throw new Error("request_id is required (or use use_current_request: true).");

      const found = useAppStore.getState().findRequest(requestId);
      if (!found.request) throw new Error(`Request "${requestId}" not found.`);

      const id = crypto.randomUUID();
      const step = { ...requestToConduitStep(found.request, conduit.steps.length), id };
      patchConduit(conduit.id, { steps: [...conduit.steps, step] });
      getEditorActions()?.selectStep?.(id);

      let connectMsg = "";
      const connectTo = payload?.connect_to || payload?.connect_to_step;
      const connectFrom = payload?.connect_from || payload?.connect_from_step;

      if (connectTo || connectFrom) {
        const fresh = getConduit();
        const sourceId = connectFrom
          ? requireStepRef(fresh, connectFrom).id
          : id;
        const targetId = connectTo
          ? requireStepRef(fresh, connectTo).id
          : id;

        const connected = connectStepsOnConduit(
          fresh,
          sourceId,
          targetId,
          getEditorActions()?.connect,
          patchConduit,
        );
        connectMsg = connected ? ` Connected to "${connectTo || connectFrom}".` : " Already connected.";
      }

      return {
        message: `Added "${found.request.name}" (step id: ${id}).${connectMsg}`,
        stepId: id,
      };
    },

    "conduit.add_empty_step": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const editor = getEditorActions();
      if (editor?.addEmptyStep) {
        const stepId = editor.addEmptyStep(payload?.name);
        return { message: `Added empty step${payload?.name ? ` "${payload.name}"` : ""}.`, stepId };
      }

      const id = crypto.randomUUID();
      const step = {
        ...createEmptyStep(conduit.steps.length),
        id,
        name: payload?.name || "New step",
      };
      patchConduit(conduit.id, { steps: [...conduit.steps, step] });
      return { message: `Added empty step "${step.name}".`, stepId: id };
    },

    "conduit.delete_step": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const stepId = resolveStepId(conduit, payload, getEditorActions);
      const step = resolveStepRef(conduit, stepId);

      if (getEditorActions()?.deleteStep) {
        getEditorActions().deleteStep(stepId);
      } else {
        patchConduit(conduit.id, {
          steps: conduit.steps.filter((s) => s.id !== stepId),
          layout: {
            edges: (conduit.layout?.edges || []).filter(
              (e) => e.source !== stepId && e.target !== stepId,
            ),
          },
        });
      }
      return { message: `Deleted step "${step?.name || stepId}".` };
    },

    "conduit.select_step": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const stepId = resolveStepId(conduit, payload, getEditorActions);
      getEditorActions()?.selectStep?.(stepId);
      const step = resolveStepRef(conduit, stepId);
      return { message: `Selected step "${step?.name || stepId}".` };
    },

    "conduit.move_step": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const stepId = resolveStepId(conduit, payload, getEditorActions);
      if (typeof payload?.x !== "number" || typeof payload?.y !== "number") {
        throw new Error("x and y numbers are required.");
      }

      if (getEditorActions()?.moveStep) {
        getEditorActions().moveStep(stepId, { x: payload.x, y: payload.y });
      } else {
        patchConduit(conduit.id, {
          steps: conduit.steps.map((s) => (
            s.id === stepId ? { ...s, position: { x: payload.x, y: payload.y } } : s
          )),
        });
      }
      return { message: "Step moved on canvas." };
    },

    "conduit.update_step": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const stepId = resolveStepId(conduit, payload, getEditorActions);
      const patch = payload?.patch;
      if (!patch || typeof patch !== "object") {
        throw new Error("patch object is required.");
      }

      const step = resolveStepRef(conduit, stepId);
      const next = applyConduitStepPatch(step, patch);

      if (getEditorActions()?.updateStep) {
        getEditorActions().updateStep(stepId, next);
      } else {
        patchConduit(conduit.id, {
          steps: conduit.steps.map((s) => (s.id === stepId ? next : s)),
        });
      }
      return { message: `Updated step "${step.name}".` };
    },

    "conduit.connect_steps": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const sourceId = resolveConnectRef(conduit, payload, [
        "source_id",
        "source",
        "source_name",
        "from",
      ]);
      const targetId = resolveConnectRef(conduit, payload, [
        "target_id",
        "target",
        "target_name",
        "to",
      ]);

      if (!sourceId || !targetId) {
        throw new Error("source and target (id or step name) are required.");
      }

      const connected = connectStepsOnConduit(
        conduit,
        sourceId,
        targetId,
        getEditorActions()?.connect,
        patchConduit,
      );
      return { message: connected ? "Connected steps." : "Steps are already connected." };
    },

    "conduit.chain_steps": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const refs = payload?.step_ids || payload?.step_refs || payload?.steps;
      if (!Array.isArray(refs) || refs.length < 2) {
        throw new Error("step_ids or step_refs array with at least 2 entries is required.");
      }

      const stepIds = refs.map((ref) => requireStepRef(conduit, ref).id);
      let edges = [...(conduit.layout?.edges || [])];
      let added = 0;

      for (let i = 0; i < stepIds.length - 1; i += 1) {
        const sourceId = stepIds[i];
        const targetId = stepIds[i + 1];
        if (edges.some((e) => e.source === sourceId && e.target === targetId)) continue;
        edges.push({ id: crypto.randomUUID(), source: sourceId, target: targetId });
        added += 1;
      }

      patchConduit(conduit.id, { layout: { edges } });
      return { message: added ? `Chained ${added} connection(s).` : "Steps were already chained." };
    },

    "conduit.disconnect_steps": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const edges = conduit.layout?.edges || [];
      const { edge_id: edgeId, step_id: stepIdRef } = payload || {};
      const sourceId = resolveConnectRef(conduit, payload, ["source_id", "source", "source_name"]);
      const targetId = resolveConnectRef(conduit, payload, ["target_id", "target", "target_name"]);

      let next = edges;
      if (edgeId) {
        next = edges.filter((e) => e.id !== edgeId);
      } else if (sourceId && targetId) {
        next = edges.filter((e) => !(e.source === sourceId && e.target === targetId));
      } else if (stepIdRef) {
        const stepId = requireStepRef(conduit, stepIdRef).id;
        next = edges.filter((e) => e.source !== stepId && e.target !== stepId);
      } else {
        throw new Error("Provide edge_id, source+target (name or id), or step_id.");
      }

      const removed = edges.length - next.length;
      if (!removed) return { message: "No matching connection found." };

      if (getEditorActions()?.setEdges) {
        getEditorActions().setEdges(next);
      } else {
        patchConduit(conduit.id, { layout: { edges: next } });
      }
      return { message: `Removed ${removed} connection(s).` };
    },

    "conduit.clear_connections": () => {
      const conduit = requireEditableConduit(getConduit);
      const count = conduit.layout?.edges?.length || 0;
      if (!count) return { message: "No connections to remove." };
      patchConduit(conduit.id, { layout: { edges: [] } });
      return { message: `Removed all ${count} connection(s).` };
    },

    "conduit.set_name": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const name = payload?.name?.trim();
      if (!name) throw new Error("name is required.");
      patchConduit(conduit.id, { name });
      return { message: `Renamed conduit to "${name}".` };
    },

    "conduit.set_visibility": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const visibility = payload?.visibility;
      if (!VISIBILITIES.has(visibility)) {
        throw new Error('visibility must be "private", "team", or "shared".');
      }
      const sharedWith = visibility === "shared"
        ? (Array.isArray(payload.shared_with) ? payload.shared_with : [])
        : [];
      patchConduit(conduit.id, { visibility, sharedWith });
      return { message: `Visibility set to ${visibility}.` };
    },

    "conduit.set_environment": (payload) => {
      requireEditableConduit(getConduit);
      const environmentId = payload?.environment_id;
      if (!environmentId) throw new Error("environment_id is required.");
      if (!setSelectedEnvId) throw new Error("Environment picker not available.");
      setSelectedEnvId(environmentId);
      return { message: "Run environment updated." };
    },

    "conduit.create": async (payload) => {
      if (!createConduit) throw new Error("Create conduit is only available from the list view.");
      const name = payload?.name?.trim() || "New conduit";
      const visibility = VISIBILITIES.has(payload?.visibility) ? payload.visibility : "private";
      const created = await createConduit({ name, visibility });
      if (navigate && created?.id) navigate(`/conduits/${created.id}`);
      return { message: `Created conduit "${created.name}".` };
    },
  };
}
