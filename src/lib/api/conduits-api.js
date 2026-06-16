import { apiRequest } from "@/lib/api/http";

export function listConduits(teamId) {
  return apiRequest(`/teams/${teamId}/conduits`);
}

export function createConduit(teamId, payload) {
  return apiRequest(`/teams/${teamId}/conduits`, { method: "POST", body: payload });
}

export function updateConduit(teamId, conduitId, payload) {
  return apiRequest(`/teams/${teamId}/conduits/${conduitId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteConduit(teamId, conduitId) {
  return apiRequest(`/teams/${teamId}/conduits/${conduitId}`, { method: "DELETE" });
}
