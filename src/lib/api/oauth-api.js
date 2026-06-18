import { apiRequest } from "@/lib/api/http";

export function fetchOAuthToken(teamId, payload) {
  return apiRequest(`/teams/${teamId}/oauth/token`, { method: "POST", body: payload });
}
