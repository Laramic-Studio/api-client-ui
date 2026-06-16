import { apiRequest } from "@/lib/api/http";

export function listEnvironments(teamId) {
  return apiRequest(`/teams/${teamId}/environments`);
}

export function createEnvironment(teamId, payload) {
  return apiRequest(`/teams/${teamId}/environments`, { method: "POST", body: payload });
}

export function updateEnvironment(teamId, environmentId, payload) {
  return apiRequest(`/teams/${teamId}/environments/${environmentId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteEnvironment(teamId, environmentId) {
  return apiRequest(`/teams/${teamId}/environments/${environmentId}`, { method: "DELETE" });
}

export function duplicateEnvironment(teamId, environmentId) {
  return apiRequest(`/teams/${teamId}/environments/${environmentId}/duplicate`, { method: "POST" });
}

export function activateEnvironment(teamId, environmentId) {
  return apiRequest(`/teams/${teamId}/environments/${environmentId}/activate`, { method: "POST" });
}

export function setEnvironmentPreference(teamId, payload) {
  return apiRequest(`/teams/${teamId}/environment-preferences`, {
    method: "PUT",
    body: payload,
  });
}
