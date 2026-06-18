import { apiRequest } from "@/lib/api/http";

export function listHistory(teamId) {
  return apiRequest(`/teams/${teamId}/history`);
}

export function createHistoryEntry(teamId, payload) {
  return apiRequest(`/teams/${teamId}/history`, { method: "POST", body: payload });
}

export function toggleHistoryFavorite(teamId, entryId) {
  return apiRequest(`/teams/${teamId}/history/${entryId}/favorite`, { method: "POST" });
}

export function deleteHistoryEntry(teamId, entryId) {
  return apiRequest(`/teams/${teamId}/history/${entryId}`, { method: "DELETE" });
}

export function clearHistory(teamId) {
  return apiRequest(`/teams/${teamId}/history/clear`, { method: "POST" });
}
