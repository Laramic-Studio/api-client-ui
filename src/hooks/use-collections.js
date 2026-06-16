import {
  mapApiCollection,
  mapCollectionToApi,
  mapCreateFolderPayload,
  mapFolderToApi,
} from "@/lib/api/map-collection";
import * as collectionsApi from "@/lib/api/collections-api";
import { collectionKeys } from "@/lib/api/query-keys";
import { useAppStore } from "@/store/useAppStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

export function applyCollectionsToStore(teamId, data) {
  const collections = (data.collections || []).map((collection) =>
    mapApiCollection(collection, teamId),
  );

  useAppStore.setState((state) => ({
    collectionsMap: {
      ...state.collectionsMap,
      [String(teamId)]: collections,
    },
  }));

  return collections;
}

export async function refreshCollectionsInStore(teamId) {
  if (!teamId) return [];
  const data = await collectionsApi.listCollections(teamId);
  return applyCollectionsToStore(teamId, data);
}

export function useActiveTeamId() {
  return useAppStore((s) => s.activeWorkspaceId);
}

export function useCollections() {
  const teamId = useActiveTeamId();

  return useQuery({
    queryKey: collectionKeys.list(teamId),
    queryFn: async () => {
      const data = await collectionsApi.listCollections(teamId);
      return applyCollectionsToStore(teamId, data);
    },
    enabled: Boolean(teamId),
    staleTime: 30 * 1000,
  });
}

function invalidateCollections(queryClient, teamId) {
  if (teamId) {
    queryClient.invalidateQueries({ queryKey: collectionKeys.list(teamId) });
  }
}

export function useCreateCollection() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => collectionsApi.createCollection(teamId, payload),
    onSuccess: () => invalidateCollections(queryClient, teamId),
  });
}

export function useUpdateCollection() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }) =>
      collectionsApi.updateCollection(teamId, id, mapCollectionToApi(patch)),
    onSuccess: () => invalidateCollections(queryClient, teamId),
  });
}

export function useDebouncedCollectionUpdate(delay = 700) {
  const update = useUpdateCollection();

  return useDebouncedCallback((id, patch) => {
    update.mutate({ id, patch });
  }, delay);
}

export function useDeleteCollection() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => collectionsApi.deleteCollection(teamId, id),
    onSuccess: () => invalidateCollections(queryClient, teamId),
  });
}

export function useDuplicateCollection() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => collectionsApi.duplicateCollection(teamId, id),
    onSuccess: () => invalidateCollections(queryClient, teamId),
  });
}

export function useCreateCollectionRequest() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, payload }) =>
      collectionsApi.createCollectionRequest(teamId, collectionId, payload),
    onSuccess: () => invalidateCollections(queryClient, teamId),
  });
}

export function useCreateFolder() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, payload }) =>
      collectionsApi.createFolder(teamId, collectionId, mapCreateFolderPayload(payload)),
    onSuccess: () => invalidateCollections(queryClient, teamId),
  });
}

export function useUpdateFolder() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, folderId, patch }) =>
      collectionsApi.updateFolder(teamId, collectionId, folderId, mapFolderToApi(patch)),
    onSuccess: () => invalidateCollections(queryClient, teamId),
  });
}

export function useDeleteFolder() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, folderId }) =>
      collectionsApi.deleteFolder(teamId, collectionId, folderId),
    onSuccess: () => invalidateCollections(queryClient, teamId),
  });
}
