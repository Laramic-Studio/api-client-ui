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
