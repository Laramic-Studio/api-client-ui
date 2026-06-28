export function mapApiHistoryEntry(entry) {
  if (!entry) return null;

  return {
    id: entry.id,
    teamId: entry.team_id != null ? String(entry.team_id) : null,
    userId: entry.user_id != null ? String(entry.user_id) : null,
    userName: entry.user?.name || null,
    userEmail: entry.user?.email || null,
    method: entry.method,
    url: entry.url,
    status: entry.status,
    statusText: entry.status_text || "",
    durationMs: entry.duration_ms ?? 0,
    sizeBytes: entry.size_bytes ?? 0,
    ok: Boolean(entry.ok),
    requestId: entry.request_id || null,
    collectionId: entry.collection_id || null,
    requestName: entry.request_name || "Untitled request",
    collectionName: entry.collection_name || "Scratch",
    favorite: Boolean(entry.favorite),
    timestamp: entry.timestamp ?? Date.now(),
  };
}

export function mapHistoryEntryToApi(entry) {
  return {
    method: entry.method,
    url: entry.url,
    status: entry.status,
    status_text: entry.statusText || "",
    duration_ms: entry.durationMs ?? 0,
    size_bytes: entry.sizeBytes ?? 0,
    ok: Boolean(entry.ok),
    request_id: entry.requestId || null,
    collection_id: entry.collectionId || null,
    request_name: entry.requestName || "Untitled request",
    collection_name: entry.collectionName || "Scratch",
  };
}

export function normalizeHistoryFilters(filters = {}) {
  return {
    q: (filters.q || "").trim(),
    method: filters.method && filters.method !== "ALL" ? filters.method : "",
    status: filters.status && filters.status !== "ALL" ? filters.status : "",
    favorite: Boolean(filters.favorite),
  };
}

export function toHistoryApiParams(filters = {}) {
  const normalized = normalizeHistoryFilters(filters);
  const params = {};
  if (normalized.q) params.q = normalized.q;
  if (normalized.method) params.method = normalized.method;
  if (normalized.status) params.status = normalized.status;
  if (normalized.favorite) params.favorite = 1;
  return params;
}

export function hasActiveHistoryFilters(filters = {}) {
  const normalized = normalizeHistoryFilters(filters);
  return Boolean(normalized.q || normalized.method || normalized.status || normalized.favorite);
}
