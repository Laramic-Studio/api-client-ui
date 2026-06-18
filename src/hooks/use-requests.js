import { mapExampleToApi, mapRequestToApi } from "@/lib/api/map-request";
import * as requestsApi from "@/lib/api/requests-api";
import * as collectionsApi from "@/lib/api/collections-api";
import { collectionKeys } from "@/lib/api/query-keys";
import { refreshCollectionsInStore, useActiveTeamId } from "@/hooks/use-collections";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useAppStore } from "@/store/useAppStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function invalidateCollections(queryClient, teamId) {
  if (teamId) {
    queryClient.invalidateQueries({ queryKey: collectionKeys.list(teamId) });
  }
}

export function useUpdateRequest() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, requestId, patch }) =>
      requestsApi.updateRequest(teamId, collectionId, requestId, mapRequestToApi(patch)),
    onSuccess: async () => {
      await refreshCollectionsInStore(teamId);
      invalidateCollections(queryClient, teamId);
    },
  });
}

export function useDebouncedRequestUpdate(delay = 700) {
  const updateRequest = useUpdateRequest();

  return useDebouncedCallback(async ({ collectionId, requestId, patch }) => {
    await updateRequest.mutateAsync({ collectionId, requestId, patch });
  }, delay);
}

export function useDeleteRequest() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, requestId }) =>
      requestsApi.deleteRequest(teamId, collectionId, requestId),
    onSuccess: async () => {
      await refreshCollectionsInStore(teamId);
      invalidateCollections(queryClient, teamId);
    },
  });
}

export function useMoveRequest() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, requestId, folderId }) =>
      requestsApi.updateRequest(teamId, collectionId, requestId, { folder_id: folderId }),
    onSuccess: async () => {
      await refreshCollectionsInStore(teamId);
      invalidateCollections(queryClient, teamId);
    },
  });
}

export function useReorderRequests() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, requestIds }) =>
      requestsApi.reorderRequests(teamId, collectionId, requestIds),
    onSuccess: async () => {
      await refreshCollectionsInStore(teamId);
      invalidateCollections(queryClient, teamId);
    },
  });
}

export function useCreateRequest() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, payload }) => {
      const body = {
        ...mapRequestToApi(payload || {}),
        name: payload?.name || "Untitled request",
      };
      const folderId = payload?.folderId ?? payload?.folder_id;
      if (folderId !== undefined && folderId !== null) {
        body.folder_id = folderId;
      }
      return collectionsApi.createCollectionRequest(teamId, collectionId, body);
    },
    onSuccess: async () => {
      await refreshCollectionsInStore(teamId);
      invalidateCollections(queryClient, teamId);
    },
  });
}

export function useAddRequestExample() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, requestId, example }) =>
      requestsApi.addRequestExample(teamId, collectionId, requestId, mapExampleToApi(example)),
    onSuccess: async () => {
      await refreshCollectionsInStore(teamId);
      invalidateCollections(queryClient, teamId);
    },
  });
}

export function useDeleteRequestExample() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, requestId, exampleId }) =>
      requestsApi.deleteRequestExample(teamId, collectionId, requestId, exampleId),
    onSuccess: async () => {
      await refreshCollectionsInStore(teamId);
      invalidateCollections(queryClient, teamId);
    },
  });
}

export function computeReorderedRequestIds(collection, fromId, toId) {
  const arr = collection.requests.map((r) => ({ ...r }));
  const fromIndex = arr.findIndex((r) => r.id === fromId);
  const toIndex = arr.findIndex((r) => r.id === toId);
  if (fromIndex < 0 || toIndex < 0) return arr.map((r) => r.id);

  const [moved] = arr.splice(fromIndex, 1);
  moved.folderId = arr[toIndex]?.folderId ?? null;
  arr.splice(toIndex, 0, moved);

  return { requestIds: arr.map((r) => r.id), folderId: moved.folderId };
}

export function applyOptimisticRequestPatch(collectionId, requestId, patch) {
  const wsId = useAppStore.getState().activeWorkspaceId;
  useAppStore.setState((state) => ({
    collectionsMap: {
      ...state.collectionsMap,
      [wsId]: (state.collectionsMap[wsId] || []).map((c) =>
        c.id === collectionId
          ? {
              ...c,
              requests: c.requests.map((r) => (r.id === requestId ? { ...r, ...patch } : r)),
            }
          : c,
      ),
    },
  }));
}
