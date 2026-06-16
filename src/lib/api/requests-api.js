import { apiRequest } from "@/lib/api/http";

export function updateRequest(teamId, collectionId, requestId, payload) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}/requests/${requestId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteRequest(teamId, collectionId, requestId) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}/requests/${requestId}`, {
    method: "DELETE",
  });
}

export function reorderRequests(teamId, collectionId, requestIds) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}/requests/reorder`, {
    method: "PUT",
    body: { request_ids: requestIds },
  });
}

export function addRequestExample(teamId, collectionId, requestId, payload) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}/requests/${requestId}/examples`, {
    method: "POST",
    body: payload,
  });
}

export function deleteRequestExample(teamId, collectionId, requestId, exampleId) {
  return apiRequest(
    `/teams/${teamId}/collections/${collectionId}/requests/${requestId}/examples/${exampleId}`,
    { method: "DELETE" },
  );
}
