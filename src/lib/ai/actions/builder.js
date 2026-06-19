import { registerAiAction } from "@/lib/ai/actions/registry";
import { useAppStore } from "@/store/useAppStore";

registerAiAction("builder.open_request", {
  label: "Open request",
  risk: "low",
  validate(payload) {
    if (!payload?.request_id) throw new Error("request_id is required.");
  },
  async execute(payload, { navigate }) {
    const { request_id: requestId } = payload;
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
});
