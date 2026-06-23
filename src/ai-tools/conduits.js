import { defineAction, defineTool } from "@/ai-tools/types";

export const conduitsTool = defineTool({
  id: "conduits",
  scope: "page",
  pageId: "conduits",
  description: "Conduit canvas and editor — steps, connections, visibility, environment",
  actions: {
    "conduit.create": defineAction({
      label: "Create conduit",
      description: "Create a new conduit and open it (list view)",
      risk: "medium",
      requiresBinding: true,
      payloadHint: '{"name":"My flow","visibility":"private|team|shared"}',
      validate(payload) {
        if (payload?.visibility && !["private", "team", "shared"].includes(payload.visibility)) {
          throw new Error('visibility must be "private", "team", or "shared".');
        }
      },
    }),

    "conduit.add_step_from_request": defineAction({
      label: "Add step from request",
      description: "Import a saved collection request onto the canvas; optionally connect to another step by name in the same action",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"request_id":"<uuid>","use_current_request":true,"connect_to":"comment"}',
      validate(payload) {
        if (!payload?.request_id && !payload?.use_current_request && !payload?.use_builder_request) {
          throw new Error("request_id or use_current_request is required.");
        }
      },
    }),

    "conduit.add_empty_step": defineAction({
      label: "Add empty step",
      description: "Add a blank step node to the canvas",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"name":"Optional step name"}',
    }),

    "conduit.delete_step": defineAction({
      label: "Delete step",
      description: "Remove a step and its connections",
      risk: "medium",
      requiresBinding: true,
      payloadHint: '{"step_id":"<uuid>"}',
      validate(payload) {
        if (!payload?.step_id) throw new Error("step_id is required.");
      },
    }),

    "conduit.select_step": defineAction({
      label: "Select step",
      description: "Focus a step in the side editor",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"step_id":"<uuid>"}',
      validate(payload) {
        if (!payload?.step_id) throw new Error("step_id is required.");
      },
    }),

    "conduit.move_step": defineAction({
      label: "Move step",
      description: "Reposition a step node on the canvas",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"step_id":"<uuid>","x":120,"y":80}',
      validate(payload) {
        if (!payload?.step_id) throw new Error("step_id is required.");
        if (typeof payload?.x !== "number" || typeof payload?.y !== "number") {
          throw new Error("x and y are required numbers.");
        }
      },
    }),

    "conduit.update_step": defineAction({
      label: "Update step",
      description: "Patch the selected step (or match by name). Use patch.set_param, patch.set_header, patch.url, patch.method, patch.body, extractions, condition",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"patch":{"set_param":{"key":"userId","value":"10"}}} | {"step_ref":"comment","patch":{"url":"..."}}',
      validate(payload) {
        if (!payload?.patch || typeof payload.patch !== "object") {
          throw new Error("patch object is required.");
        }
      },
    }),

    "conduit.connect_steps": defineAction({
      label: "Connect steps",
      description: "Add a canvas edge — source/target accept step id or partial step name",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"source":"get todos","target":"comment"}',
      validate(payload) {
        const hasSource = payload?.source_id || payload?.source || payload?.source_name || payload?.from;
        const hasTarget = payload?.target_id || payload?.target || payload?.target_name || payload?.to;
        if (!hasSource || !hasTarget) {
          throw new Error("source and target (id or step name) are required.");
        }
      },
    }),

    "conduit.chain_steps": defineAction({
      label: "Chain steps in order",
      description: "Connect multiple steps sequentially — ids or partial step names",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"step_refs":["get post","comment","create todo"]}',
      validate(payload) {
        const refs = payload?.step_ids || payload?.step_refs || payload?.steps;
        if (!Array.isArray(refs) || refs.length < 2) {
          throw new Error("step_refs (or step_ids) must have at least 2 entries.");
        }
      },
    }),

    "conduit.disconnect_steps": defineAction({
      label: "Disconnect steps",
      description: "Remove edge by edge_id, source+target pair, or all edges on a step_id",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"edge_id":"<uuid>"} | {"source_id":"...","target_id":"..."} | {"step_id":"<uuid>"}',
    }),

    "conduit.clear_connections": defineAction({
      label: "Clear all connections",
      description: "Remove every edge on the canvas",
      risk: "medium",
      requiresBinding: true,
      payloadHint: "{}",
    }),

    "conduit.set_name": defineAction({
      label: "Rename conduit",
      description: "Change the conduit display name",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"name":"My API flow"}',
      validate(payload) {
        if (!payload?.name?.trim()) throw new Error("name is required.");
      },
    }),

    "conduit.set_visibility": defineAction({
      label: "Set visibility",
      description: "private | team (workspace) | shared (restricted members)",
      risk: "medium",
      requiresBinding: true,
      payloadHint: '{"visibility":"team"} | {"visibility":"shared","shared_with":[1,2]}',
      validate(payload) {
        if (!["private", "team", "shared"].includes(payload?.visibility)) {
          throw new Error('visibility must be "private", "team", or "shared".');
        }
      },
    }),

    "conduit.set_environment": defineAction({
      label: "Set run environment",
      description: "Pick which environment variables are used when running the flow",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"environment_id":"<uuid>"}',
      validate(payload) {
        if (!payload?.environment_id) throw new Error("environment_id is required.");
      },
    }),
  },
});
