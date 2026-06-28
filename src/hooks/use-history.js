import { mapApiHistoryEntry, mapHistoryEntryToApi, toHistoryApiParams } from "@/lib/api/map-history";
import * as historyApi from "@/lib/api/history-api";
import { historyKeys } from "@/lib/api/query-keys";
import { useAppStore } from "@/store/useAppStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function applyHistoryToStore(entries) {
  useAppStore.setState({ history: entries });
  return entries;
}

export async function refreshHistoryInStore(teamId) {
  if (!teamId) return [];
  const data = await historyApi.listHistory(teamId);
  const entries = (data.history || []).map(mapApiHistoryEntry).filter(Boolean);
  return applyHistoryToStore(entries);
}

export function useActiveTeamId() {
  return useAppStore((s) => s.activeWorkspaceId);
}

export function useHistory(filters = null) {
  const teamId = useActiveTeamId();
  const hasFilters = filters != null;

  return useQuery({
    queryKey: historyKeys.list(teamId, hasFilters ? filters : null),
    queryFn: async () => {
      const data = await historyApi.listHistory(
        teamId,
        hasFilters ? toHistoryApiParams(filters) : undefined,
      );
      const entries = (data.history || []).map(mapApiHistoryEntry).filter(Boolean);
      if (!hasFilters) {
        applyHistoryToStore(entries);
      }
      return entries;
    },
    enabled: Boolean(teamId),
    staleTime: 15 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

function invalidateHistory(queryClient, teamId) {
  queryClient.invalidateQueries({ queryKey: historyKeys.lists() });
  if (teamId) {
    refreshHistoryInStore(teamId).catch(() => {});
  }
}

export function useCreateHistoryEntry() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry) => historyApi.createHistoryEntry(teamId, mapHistoryEntryToApi(entry)),
    onSuccess: () => invalidateHistory(queryClient, teamId),
  });
}

export function useToggleHistoryFavorite() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId) => historyApi.toggleHistoryFavorite(teamId, entryId),
    onSuccess: () => invalidateHistory(queryClient, teamId),
  });
}

export function useDeleteHistoryEntry() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId) => historyApi.deleteHistoryEntry(teamId, entryId),
    onSuccess: () => invalidateHistory(queryClient, teamId),
  });
}

export function useClearHistory() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => historyApi.clearHistory(teamId),
    onSuccess: () => invalidateHistory(queryClient, teamId),
  });
}
