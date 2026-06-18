import { apiRequest } from "@/lib/api/http";

export function proxyRequest(teamId, payload) {
  return apiRequest(`/teams/${teamId}/proxy`, { method: "POST", body: payload });
}
