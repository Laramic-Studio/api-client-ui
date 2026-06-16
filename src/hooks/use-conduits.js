import { mapApiConduit, mapConduitToApi } from "@/lib/api/map-conduit";
import * as conduitsApi from "@/lib/api/conduits-api";
import { conduitKeys } from "@/lib/api/query-keys";
import { useAppStore } from "@/store/useAppStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

export function useActiveTeamId() {
  return useAppStore((s) => s.activeWorkspaceId);
}

function invalidateConduits(queryClient, teamId) {
  if (teamId) {
    queryClient.invalidateQueries({ queryKey: conduitKeys.list(teamId) });
  }
}

export function useConduits() {
  const teamId = useActiveTeamId();

  return useQuery({
    queryKey: conduitKeys.list(teamId),
    queryFn: async () => {
      const data = await conduitsApi.listConduits(teamId);
      return (data.conduits || []).map(mapApiConduit);
    },
    enabled: Boolean(teamId),
    staleTime: 30 * 1000,
  });
}

export function useCreateConduit() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => conduitsApi.createConduit(teamId, mapConduitToApi(payload)),
    onSuccess: () => invalidateConduits(queryClient, teamId),
  });
}

export function useUpdateConduit() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }) =>
      conduitsApi.updateConduit(teamId, id, mapConduitToApi(patch)),
    onSuccess: () => invalidateConduits(queryClient, teamId),
  });
}

export function useDebouncedConduitUpdate(delay = 600) {
  const update = useUpdateConduit();

  return useDebouncedCallback((id, patch) => {
    update.mutate({ id, patch });
  }, delay);
}

export function useDeleteConduit() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => conduitsApi.deleteConduit(teamId, id),
    onSuccess: () => invalidateConduits(queryClient, teamId),
  });
}
