import { defineAction, defineTool } from "@/ai-tools/types";
import { executeConduitRun, resolveConduit } from "@/lib/ai/conduit-run";
import { getClient } from "@/lib/api/client";
import { useAppStore } from "@/store/useAppStore";

export const catalogTool = defineTool({
  id: "catalog",
  scope: "global",
  description: "Cross-page workspace actions — open and run from anywhere",
  actions: {
    "conduit.open": defineAction({
      label: "Open conduit",
      description: "Navigate to a conduit editor by id or partial name match",
      risk: "low",
      payloadHint: '{"conduit_id":"<uuid>"} or {"name":"web"}',
      validate(payload) {
        if (!payload?.conduit_id && !payload?.name) {
          throw new Error("conduit_id or name is required.");
        }
      },
      async execute(payload, { navigate }) {
        const conduit = await resolveConduit(payload);
        navigate(`/conduits/${conduit.id}`);
        return { ok: true, message: `Opened conduit "${conduit.name}".` };
      },
    }),
    "conduit.run": defineAction({
      label: "Run conduit",
      description: "Execute a flow; optionally skip/disconnect steps by name before running",
      risk: "low",
      payloadHint: '{"name":"web","exclude_step_names":["comment"],"disconnect_step_names":["comment"],"persist_disconnect":true}',
      validate(payload) {
        if (!payload?.conduit_id && !payload?.name) {
          throw new Error("conduit_id or name is required.");
        }
      },
      execute: executeConduitRun,
    }),
    "builder.open_request": defineAction({
      label: "Open request",
      description: "Open a saved collection request in the API builder",
      risk: "low",
      payloadHint: '{"request_id":"<uuid>"}',
      validate(payload) {
        if (!payload?.request_id) throw new Error("request_id is required.");
      },
      execute(payload, { navigate }) {
        const requestId = payload.request_id;
        const found = useAppStore.getState().findRequest(requestId);
        if (!found.request) throw new Error(`Request "${requestId}" not found.`);

        const { openTab, clearBuilderDraft, clearBuilderActiveExample } = useAppStore.getState();
        clearBuilderDraft(requestId);
        clearBuilderActiveExample(requestId);
        openTab({
          id: requestId,
          collectionId: found.collection.id,
          label: found.request.name,
        });
        navigate(`/builder/${requestId}`);

        return {
          ok: true,
          message: `Opened "${found.request.name}" (${found.request.method} ${found.request.url}).`,
        };
      },
    }),
  },
});
