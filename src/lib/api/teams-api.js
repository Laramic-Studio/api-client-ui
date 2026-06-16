import { apiRequest } from "@/lib/api/http";
import * as authApi from "@/lib/api/auth-api";

export async function listTeams() {
  return authApi.listTeams();
}

export async function getTeam(teamId) {
  return apiRequest(`/teams/${teamId}`);
}

export async function createTeam({ name }) {
  return apiRequest("/teams", { method: "POST", body: { name } });
}

export async function updateTeam(teamId, { name }) {
  return apiRequest(`/teams/${teamId}`, { method: "PATCH", body: { name } });
}

export async function deleteTeam(teamId, { name }) {
  return apiRequest(`/teams/${teamId}`, { method: "DELETE", body: { name } });
}

export async function duplicateTeam(teamId, payload = {}) {
  return apiRequest(`/teams/${teamId}/duplicate`, { method: "POST", body: payload });
}

export async function switchTeam(teamId) {
  return authApi.switchTeam(teamId);
}

export async function inviteMember(teamId, { email, role }) {
  return apiRequest(`/teams/${teamId}/invitations`, {
    method: "POST",
    body: { email, role },
  });
}

export async function cancelInvitation(teamId, code) {
  return apiRequest(`/teams/${teamId}/invitations/${code}`, { method: "DELETE" });
}

export async function acceptInvitation(code) {
  return apiRequest(`/invitations/${code}/accept`, { method: "POST" });
}

export async function getInvitation(code) {
  return apiRequest(`/invitations/${code}`);
}

export async function updateMemberRole(teamId, memberId, { role }) {
  return apiRequest(`/teams/${teamId}/members/${memberId}`, {
    method: "PATCH",
    body: { role },
  });
}

export async function removeMember(teamId, memberId) {
  return apiRequest(`/teams/${teamId}/members/${memberId}`, { method: "DELETE" });
}
