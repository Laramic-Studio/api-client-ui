import * as authApi from "@/lib/api/auth-api";
import { mapApiUser, teamToWorkspace } from "@/lib/api/map-user";
import { userIsOnboarded, userIsVerified } from "@/lib/auth/user-state";
import { clearAccessToken } from "@/lib/auth/tokens";
import { refreshEnvironmentsInStore } from "@/hooks/use-environments";
import { useAppStore } from "@/store/useAppStore";

function mergeUser(mapped, existing) {
  if (!existing || existing.id !== mapped.id) return mapped;

  return {
    ...mapped,
    emailVerified: userIsVerified(mapped) || userIsVerified(existing),
    onboarded: userIsOnboarded(mapped) || userIsOnboarded(existing),
  };
}

function ensureWorkspaceMaps(workspaces, activeWorkspaceId) {
  const state = useAppStore.getState();
  const collectionsMap = { ...state.collectionsMap };
  const environmentsMap = { ...state.environmentsMap };

  const ids = new Set(
    [...workspaces.map((w) => w.id), activeWorkspaceId].filter(Boolean),
  );

  for (const id of ids) {
    if (!collectionsMap[id]) collectionsMap[id] = [];
    if (!environmentsMap[id]) environmentsMap[id] = [];
  }

  return { collectionsMap, environmentsMap };
}

export function applySession(data) {
  if (!data?.user) {
    throw new Error("API response missing user payload.");
  }

  const teams = (data.teams || []).map(teamToWorkspace);
  const currentTeam = data.current_team;
  const mapped = mapApiUser(data.user, currentTeam);
  const existing = useAppStore.getState().user;
  const user = mergeUser(mapped, existing);
  const workspaces = teams.length ? teams : (currentTeam ? [teamToWorkspace(currentTeam)] : []);
  const activeWorkspaceId = currentTeam ? String(currentTeam.id) : teams[0]?.id || null;
  const { collectionsMap, environmentsMap } = ensureWorkspaceMaps(workspaces, activeWorkspaceId);

  useAppStore.getState().setAuthSession({
    user,
    currentTeam,
    teams,
    workspaces,
    activeWorkspaceId,
    collectionsMap,
    environmentsMap,
  });

  return user;
}

export async function refreshTeamsInStore() {
  const teams = await authApi.listTeams().catch(() => []);
  return applyTeamsList(teams);
}

export function applyTeamsList(teams) {
  const workspaces = teams.map(teamToWorkspace);
  const currentTeam = teams.find((t) => t.isCurrent) || teams[0] || null;
  const activeWorkspaceId = currentTeam ? String(currentTeam.id) : workspaces[0]?.id || null;
  const { collectionsMap, environmentsMap } = ensureWorkspaceMaps(workspaces, activeWorkspaceId);
  const user = useAppStore.getState().user;

  useAppStore.getState().setAuthSession({
    user,
    currentTeam,
    workspaces,
    activeWorkspaceId,
    collectionsMap,
    environmentsMap,
  });

  return { teams, workspaces, currentTeam };
}

export function applyTeamSwitch(currentTeam) {
  const state = useAppStore.getState();
  const activeWorkspaceId = String(currentTeam.id);
  const workspaces = state.workspaces.map((w) => ({
    ...w,
    id: String(w.id),
  }));
  const { collectionsMap, environmentsMap } = ensureWorkspaceMaps(workspaces, activeWorkspaceId);

  useAppStore.setState({
    currentTeam,
    activeWorkspaceId,
    openTabs: [],
    activeTabId: null,
    collectionsMap,
    environmentsMap,
  });
}

export async function fetchSession() {
  const data = await authApi.me();
  const teams = await authApi.listTeams().catch(() => []);
  const user = applySession({ ...data, teams });
  const teamId = useAppStore.getState().activeWorkspaceId;

  if (teamId) {
    await refreshEnvironmentsInStore(teamId).catch(() => []);
  }

  return user;
}

export function clearSession() {
  clearAccessToken();
  useAppStore.getState().clearAuthSession();
}
