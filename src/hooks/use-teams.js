import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/hooks/use-auth";
import { teamKeys } from "@/lib/api/query-keys";
import * as teamsApi from "@/lib/api/teams-api";
import {
  applyTeamSwitch,
  refreshTeamsInStore,
} from "@/lib/api/session";
import { useAppStore } from "@/store/useAppStore";

export function useTeams() {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: teamsApi.listTeams,
    staleTime: 60 * 1000,
  });
}

export function useActiveTeamId() {
  return useAppStore((s) => s.activeWorkspaceId);
}

export function useTeamDetail(teamId) {
  const id = teamId || useAppStore.getState().activeWorkspaceId;

  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => teamsApi.getTeam(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

function invalidateTeamQueries(queryClient, teamId) {
  queryClient.invalidateQueries({ queryKey: teamKeys.list() });
  if (teamId) {
    queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
  }
}

export function useSwitchTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId) => teamsApi.switchTeam(teamId),
    onSuccess: async (data) => {
      applyTeamSwitch(data.current_team);
      await refreshTeamsInStore();
      invalidateTeamQueries(queryClient, data.current_team?.id);
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => teamsApi.createTeam(payload),
    onSuccess: async () => {
      await refreshTeamsInStore();
      invalidateTeamQueries(queryClient);
    },
  });
}

export function useRenameTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, name }) => teamsApi.updateTeam(teamId, { name }),
    onSuccess: async (_data, { teamId }) => {
      await refreshTeamsInStore();
      invalidateTeamQueries(queryClient, teamId);
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, name }) => teamsApi.deleteTeam(teamId, { name }),
    onSuccess: async (data) => {
      if (data.current_team) {
        applyTeamSwitch(data.current_team);
      }
      await refreshTeamsInStore();
      invalidateTeamQueries(queryClient);
    },
  });
}

export function useInviteMember(teamId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => teamsApi.inviteMember(teamId, payload),
    onSuccess: () => invalidateTeamQueries(queryClient, teamId),
  });
}

export function useCancelInvitation(teamId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code) => teamsApi.cancelInvitation(teamId, code),
    onSuccess: () => invalidateTeamQueries(queryClient, teamId),
  });
}

export function useUpdateMemberRole(teamId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, role }) => teamsApi.updateMemberRole(teamId, memberId, { role }),
    onSuccess: () => invalidateTeamQueries(queryClient, teamId),
  });
}

export function useRemoveMember(teamId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId) => teamsApi.removeMember(teamId, memberId),
    onSuccess: async () => {
      await refreshTeamsInStore();
      invalidateTeamQueries(queryClient, teamId);
    },
  });
}

export { getErrorMessage };
