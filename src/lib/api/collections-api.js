import { apiRequest } from "@/lib/api/http";

export function listCollections(teamId) {
  return apiRequest(`/teams/${teamId}/collections`);
}

export function createCollection(teamId, payload) {
  return apiRequest(`/teams/${teamId}/collections`, { method: "POST", body: payload });
}

export function updateCollection(teamId, collectionId, payload) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteCollection(teamId, collectionId) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}`, { method: "DELETE" });
}

export function duplicateCollection(teamId, collectionId) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}/duplicate`, { method: "POST" });
}

export function createCollectionRequest(teamId, collectionId, payload = {}) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}/requests`, {
    method: "POST",
    body: payload,
  });
}

export function createFolder(teamId, collectionId, payload) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}/folders`, {
    method: "POST",
    body: payload,
  });
}

export function updateFolder(teamId, collectionId, folderId, payload) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}/folders/${folderId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteFolder(teamId, collectionId, folderId) {
  return apiRequest(`/teams/${teamId}/collections/${collectionId}/folders/${folderId}`, {
    method: "DELETE",
  });
}
