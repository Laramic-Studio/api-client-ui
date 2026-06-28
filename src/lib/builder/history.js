import { createEmptyScratch, createScratchTabId } from "@/lib/builder/scratch";
import { useAppStore } from "@/store/useAppStore";

export function buildHistoryEntry({
  request,
  result,
  collectionName,
  requestId = null,
}) {
  return {
    method: request.method,
    url: result.url,
    status: result.status,
    statusText: result.statusText || "",
    durationMs: result.durationMs ?? 0,
    sizeBytes: result.sizeBytes ?? 0,
    ok: Boolean(result.ok),
    collectionId: request.collectionId || null,
    collectionName: collectionName || "Scratch",
    requestId,
    requestName: request.name || "Untitled request",
  };
}

/** Open builder for resend — saved request when possible, otherwise a scratch tab. */
export function replayHistoryEntry(entry) {
  const store = useAppStore.getState();
  const {
    findRequest,
    openTab,
    clearBuilderDraft,
    clearBuilderActiveExample,
    clearBuilderResponse,
    setBuilderTestResults,
    setBuilderDraft,
    setBuilderPanels,
  } = store;

  if (entry?.requestId) {
    const found = findRequest(entry.requestId);
    if (found.request) {
      const { id, name } = found.request;
      clearBuilderDraft(id);
      clearBuilderActiveExample(id);
      clearBuilderResponse(id);
      setBuilderTestResults(id, { results: [], logs: [] });
      openTab({
        id,
        collectionId: found.collection.id,
        label: name || entry.requestName || "Request",
      });
      setBuilderPanels({ responseOpen: true });
      return { tabId: id, path: `/builder/${id}` };
    }
  }

  const tabId = createScratchTabId();
  const scratch = {
    ...createEmptyScratch(tabId),
    method: entry?.method || "GET",
    url: entry?.url || "",
    name: entry?.requestName || "Untitled request",
    collectionId: entry?.collectionId || null,
  };
  setBuilderDraft(tabId, scratch);
  openTab({ id: tabId, scratch: true, label: entry?.requestName || "Replay" });
  setBuilderPanels({ responseOpen: true });
  return { tabId, path: "/builder" };
}
