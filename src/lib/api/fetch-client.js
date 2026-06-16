import * as authApi from "@/lib/api/auth-api";
import { client as mockClient } from "@/lib/api/client";
import { teamToWorkspace } from "@/lib/api/map-user";
import {
  applySession,
  applyTeamSwitch,
  clearSession,
  fetchSession,
  refreshTeamsInStore,
} from "@/lib/api/session";
import * as environmentsApi from "@/lib/api/environments-api";
import { mapEnvironmentToApi } from "@/lib/api/map-environment";
import * as teamsApi from "@/lib/api/teams-api";
import { useAppStore } from "@/store/useAppStore";
import { refreshEnvironmentsInStore } from "@/hooks/use-environments";

export { applySession, fetchSession, clearSession };

export const fetchClient = {
  ...mockClient,

  async register({ name, email, password, password_confirmation, remember = true }) {
    const data = await authApi.register({ name, email, password, password_confirmation, remember });
    const teams = await authApi.listTeams().catch(() => []);
    return applySession({ ...data, teams });
  },

  async login({ email, password, remember = true }) {
    const data = await authApi.login({ email, password, remember });
    const teams = await authApi.listTeams().catch(() => []);
    return applySession({ ...data, teams });
  },

  async logout() {
    await authApi.logout();
    clearSession();
  },

  async me() {
    return fetchSession();
  },

  async listWorkspaces() {
    const teams = await teamsApi.listTeams();
    return teams.map(teamToWorkspace);
  },

  async createWorkspace(name) {
    const data = await teamsApi.createTeam({ name });
    await refreshTeamsInStore();
    return teamToWorkspace(data.team);
  },

  async renameWorkspace(id, name) {
    const data = await teamsApi.updateTeam(id, { name });
    await refreshTeamsInStore();
    return teamToWorkspace(data.team);
  },

  async duplicateWorkspace(id) {
    const data = await teamsApi.duplicateTeam(id);
    await refreshTeamsInStore();
    return teamToWorkspace(data.team);
  },

  async deleteWorkspace(id, name) {
    const data = await teamsApi.deleteTeam(id, { name });
    if (data.current_team) {
      applyTeamSwitch(data.current_team);
    }
    await refreshTeamsInStore();
  },

  async listTeam() {
    const teamId = useAppStore.getState().activeWorkspaceId;
    if (!teamId) return [];
    const data = await teamsApi.getTeam(teamId);
    return data.members || [];
  },

  async listEnvironments(opts) {
    const teamId = useAppStore.getState().activeWorkspaceId;
    if (!teamId) return [];
    await refreshEnvironmentsInStore(teamId);
    return useAppStore.getState().getEnvironments(opts);
  },

  async createEnvironment(payload) {
    const teamId = useAppStore.getState().activeWorkspaceId;
    const data = await environmentsApi.createEnvironment(teamId, {
      name: payload?.name || "New Environment",
      collection_id: payload?.collectionId || null,
    });
    await refreshEnvironmentsInStore(teamId);
    return data.environment;
  },

  async updateEnvironment(id, patch) {
    const teamId = useAppStore.getState().activeWorkspaceId;
    const data = await environmentsApi.updateEnvironment(teamId, id, mapEnvironmentToApi(patch));
    await refreshEnvironmentsInStore(teamId);
    return data.environment;
  },

  async duplicateEnvironment(id) {
    const teamId = useAppStore.getState().activeWorkspaceId;
    const data = await environmentsApi.duplicateEnvironment(teamId, id);
    await refreshEnvironmentsInStore(teamId);
    return data.environment;
  },

  async deleteEnvironment(id) {
    const teamId = useAppStore.getState().activeWorkspaceId;
    await environmentsApi.deleteEnvironment(teamId, id);
    await refreshEnvironmentsInStore(teamId);
  },

  async setActiveEnvironment(id) {
    const teamId = useAppStore.getState().activeWorkspaceId;
    await environmentsApi.activateEnvironment(teamId, id);
    await refreshEnvironmentsInStore(teamId);
  },
};
