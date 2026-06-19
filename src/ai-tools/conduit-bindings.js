import { requestToConduitStep } from "@/lib/api/map-conduit";
import { createEmptyStep } from "@/lib/conduits/step-utils";
import { useAppStore } from "@/store/useAppStore";

const VISIBILITIES = new Set(["private", "team", "shared"]);

function requireEditableConduit(getConduit) {
  const conduit = getConduit();
  if (!conduit) throw new Error("Open a conduit in the editor first.");
  if (conduit.canEdit === false) throw new Error("This conduit is read-only.");
  return conduit;
}

function findStep(conduit, stepId) {
  const step = conduit.steps.find((s) => s.id === stepId);
  if (!step) throw new Error(`Step "${stepId}" not found.`);
  return step;
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
      const requestId = payload?.request_id;
      if (!requestId) throw new Error("request_id is required.");

      const found = useAppStore.getState().findRequest(requestId);
      if (!found.request) throw new Error(`Request "${requestId}" not found.`);

      const id = crypto.randomUUID();
      const step = { ...requestToConduitStep(found.request, conduit.steps.length), id };
      patchConduit(conduit.id, { steps: [...conduit.steps, step] });
      getEditorActions()?.selectStep?.(id);
      return { message: `Added "${found.request.name}" as a step.` };
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
      const stepId = payload?.step_id;
      if (!stepId) throw new Error("step_id is required.");
      const step = findStep(conduit, stepId);

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
      return { message: `Deleted step "${step.name}".` };
    },

    "conduit.select_step": (payload) => {
      requireEditableConduit(getConduit);
      const stepId = payload?.step_id;
      if (!stepId) throw new Error("step_id is required.");
      findStep(getConduit(), stepId);
      getEditorActions()?.selectStep?.(stepId);
      return { message: "Step selected in editor." };
    },

    "conduit.move_step": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const stepId = payload?.step_id;
      if (!stepId) throw new Error("step_id is required.");
      if (typeof payload?.x !== "number" || typeof payload?.y !== "number") {
        throw new Error("x and y numbers are required.");
      }
      findStep(conduit, stepId);

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
      const stepId = payload?.step_id;
      const patch = payload?.patch;
      if (!stepId || !patch || typeof patch !== "object") {
        throw new Error("step_id and patch object are required.");
      }
      const step = findStep(conduit, stepId);

      if (getEditorActions()?.updateStep) {
        getEditorActions().updateStep(stepId, patch);
      } else {
        patchConduit(conduit.id, {
          steps: conduit.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
        });
      }
      return { message: `Updated step "${step.name}".` };
    },

    "conduit.connect_steps": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const { source_id: sourceId, target_id: targetId } = payload || {};
      if (!sourceId || !targetId) throw new Error("source_id and target_id are required.");
      findStep(conduit, sourceId);
      findStep(conduit, targetId);

      const edges = conduit.layout?.edges || [];
      if (edges.some((e) => e.source === sourceId && e.target === targetId)) {
        return { message: "Steps are already connected." };
      }

      if (getEditorActions()?.connect) {
        getEditorActions().connect(sourceId, targetId);
      } else {
        patchConduit(conduit.id, {
          layout: { edges: [...edges, { id: crypto.randomUUID(), source: sourceId, target: targetId }] },
        });
      }
      return { message: "Connected steps." };
    },

    "conduit.chain_steps": (payload) => {
      const conduit = requireEditableConduit(getConduit);
      const stepIds = payload?.step_ids;
      if (!Array.isArray(stepIds) || stepIds.length < 2) {
        throw new Error("step_ids array with at least 2 ids is required.");
      }
      stepIds.forEach((id) => findStep(conduit, id));

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
      const { edge_id: edgeId, source_id: sourceId, target_id: targetId, step_id: stepId } = payload || {};

      let next = edges;
      if (edgeId) {
        next = edges.filter((e) => e.id !== edgeId);
      } else if (sourceId && targetId) {
        next = edges.filter((e) => !(e.source === sourceId && e.target === targetId));
      } else if (stepId) {
        findStep(conduit, stepId);
        next = edges.filter((e) => e.source !== stepId && e.target !== stepId);
      } else {
        throw new Error("Provide edge_id, source_id+target_id, or step_id.");
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
