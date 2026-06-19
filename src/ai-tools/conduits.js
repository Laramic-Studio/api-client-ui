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
      description: "Import a saved collection request onto the canvas",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"request_id":"<uuid>"}',
      validate(payload) {
        if (!payload?.request_id) throw new Error("request_id is required.");
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
      description: "Patch step fields: name, method, url, headers, body, auth, extractions, condition",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"step_id":"<uuid>","patch":{"extractions":[{"path":"id","variable":"post_id","passes":[]}]}}',
      validate(payload) {
        if (!payload?.step_id || !payload?.patch || typeof payload.patch !== "object") {
          throw new Error("step_id and patch object are required.");
        }
      },
    }),

    "conduit.connect_steps": defineAction({
      label: "Connect steps",
      description: "Add a canvas edge from source step to target step",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"source_id":"<uuid>","target_id":"<uuid>"}',
      validate(payload) {
        if (!payload?.source_id || !payload?.target_id) {
          throw new Error("source_id and target_id are required.");
        }
      },
    }),

    "conduit.chain_steps": defineAction({
      label: "Chain steps in order",
      description: "Connect multiple steps sequentially (step_ids[0]→[1]→[2]…)",
      risk: "low",
      requiresBinding: true,
      payloadHint: '{"step_ids":["<uuid>","<uuid>"]}',
      validate(payload) {
        if (!Array.isArray(payload?.step_ids) || payload.step_ids.length < 2) {
          throw new Error("step_ids must be an array with at least 2 ids.");
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
