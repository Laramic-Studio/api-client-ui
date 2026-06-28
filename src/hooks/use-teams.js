import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/hooks/use-auth";
import { teamKeys, invitationKeys, envKeys, collectionKeys, historyKeys, authKeys } from "@/lib/api/query-keys";
import * as teamsApi from "@/lib/api/teams-api";
import {
  applyTeamSwitch,
  refreshTeamsInStore,
} from "@/lib/api/session";
import { refreshEnvironmentsInStore } from "@/hooks/use-environments";
import { refreshCollectionsInStore } from "@/hooks/use-collections";
import { refreshHistoryInStore } from "@/hooks/use-history";
import { clearPendingInvite } from "@/lib/invite-flow";
import { mapApiUser } from "@/lib/api/map-user";
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
      const teamId = String(data.current_team?.id);
      await refreshEnvironmentsInStore(teamId);
      await refreshCollectionsInStore(teamId);
      await refreshHistoryInStore(teamId);
      invalidateTeamQueries(queryClient, data.current_team?.id);
      queryClient.invalidateQueries({ queryKey: envKeys.list(teamId) });
      queryClient.invalidateQueries({ queryKey: collectionKeys.list(teamId) });
      queryClient.invalidateQueries({ queryKey: historyKeys.list(teamId) });
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

export function useDuplicateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, name }) => teamsApi.duplicateTeam(teamId, name ? { name } : {}),
    onSuccess: async () => {
      await refreshTeamsInStore();
      invalidateTeamQueries(queryClient);
    },
  });
}

export function useInvitation(code) {
  return useQuery({
    queryKey: invitationKeys.detail(code),
    queryFn: () => teamsApi.getInvitation(code),
    enabled: Boolean(code),
    retry: false,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code) => teamsApi.acceptInvitation(code),
    onSuccess: async (data) => {
      clearPendingInvite();
      if (data.user) {
        const user = mapApiUser(data.user, data.current_team);
        useAppStore.getState().updateUser(user);
        queryClient.setQueryData(authKeys.session(), user);
      }
      applyTeamSwitch(data.current_team);
      await refreshTeamsInStore();
      const teamId = String(data.current_team?.id);
      await refreshEnvironmentsInStore(teamId);
      await refreshCollectionsInStore(teamId);
      await refreshHistoryInStore(teamId);
      invalidateTeamQueries(queryClient, data.current_team?.id);
      queryClient.invalidateQueries({ queryKey: envKeys.list(teamId) });
      queryClient.invalidateQueries({ queryKey: collectionKeys.list(teamId) });
      queryClient.invalidateQueries({ queryKey: historyKeys.list(teamId) });
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

export function useResendInvitation(teamId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code) => teamsApi.resendInvitation(teamId, code),
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
