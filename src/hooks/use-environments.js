import {
  mapApiEnvironment,
  mapEnvironmentToApi,
  mapPreferencesToStore,
} from "@/lib/api/map-environment";
import * as environmentsApi from "@/lib/api/environments-api";
import { envKeys } from "@/lib/api/query-keys";
import { useAppStore } from "@/store/useAppStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

export function applyEnvironmentsToStore(teamId, data) {
  const environments = (data.environments || []).map((env) => mapApiEnvironment(env, teamId));
  const preferencePatch = mapPreferencesToStore(data.preferences);

  useAppStore.setState((state) => ({
    environmentsMap: {
      ...state.environmentsMap,
      [String(teamId)]: environments,
    },
    activeEnvByCollection: {
      ...state.activeEnvByCollection,
      ...preferencePatch,
    },
  }));

  return environments;
}

export async function refreshEnvironmentsInStore(teamId) {
  if (!teamId) return [];
  const data = await environmentsApi.listEnvironments(teamId);
  return applyEnvironmentsToStore(teamId, data);
}

export function useActiveTeamId() {
  return useAppStore((s) => s.activeWorkspaceId);
}

export function useEnvironments() {
  const teamId = useActiveTeamId();

  return useQuery({
    queryKey: envKeys.list(teamId),
    queryFn: async () => {
      const data = await environmentsApi.listEnvironments(teamId);
      return applyEnvironmentsToStore(teamId, data);
    },
    enabled: Boolean(teamId),
    staleTime: 30 * 1000,
  });
}

function invalidateEnvironments(queryClient, teamId) {
  if (teamId) {
    queryClient.invalidateQueries({ queryKey: envKeys.list(teamId) });
  }
}

export function useCreateEnvironment() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => environmentsApi.createEnvironment(teamId, payload),
    onSuccess: () => invalidateEnvironments(queryClient, teamId),
  });
}

export function useUpdateEnvironment() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }) =>
      environmentsApi.updateEnvironment(teamId, id, mapEnvironmentToApi(patch)),
    onSuccess: () => invalidateEnvironments(queryClient, teamId),
  });
}

export function useDebouncedEnvironmentUpdate(delay = 600) {
  const update = useUpdateEnvironment();

  return useDebouncedCallback((id, patch) => {
    update.mutate({ id, patch });
  }, delay);
}

export function useDeleteEnvironment() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => environmentsApi.deleteEnvironment(teamId, id),
    onSuccess: () => invalidateEnvironments(queryClient, teamId),
  });
}

export function useDuplicateEnvironment() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => environmentsApi.duplicateEnvironment(teamId, id),
    onSuccess: () => invalidateEnvironments(queryClient, teamId),
  });
}

export function useActivateEnvironment() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => environmentsApi.activateEnvironment(teamId, id),
    onSuccess: () => invalidateEnvironments(queryClient, teamId),
  });
}

export function useSetEnvironmentPreference() {
  const teamId = useActiveTeamId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, environmentId }) =>
      environmentsApi.setEnvironmentPreference(teamId, {
        collection_id: collectionId || null,
        environment_id: environmentId,
      }),
    onSuccess: () => invalidateEnvironments(queryClient, teamId),
  });
}
