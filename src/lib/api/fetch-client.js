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
import * as teamsApi from "@/lib/api/teams-api";
import { useAppStore } from "@/store/useAppStore";

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

  async duplicateWorkspace() {
    throw new Error("Duplicate workspace is not available yet. It will copy data via sync in a later release.");
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
};
