import { getClient } from "@/lib/api/client";
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
    queryFn: () => getClient().listConduits(),
    enabled: Boolean(teamId),
    staleTime: 30 * 1000,
  });
}

export function useCreateConduit() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => getClient().createConduit(payload),
    onSuccess: () => invalidateConduits(queryClient, teamId),
  });
}

export function useUpdateConduit() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }) => getClient().updateConduit(id, patch),
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
    mutationFn: (id) => getClient().deleteConduit(id),
    onSuccess: () => invalidateConduits(queryClient, teamId),
  });
}
