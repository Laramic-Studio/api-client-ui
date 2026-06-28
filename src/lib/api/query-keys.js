import { normalizeHistoryFilters } from "@/lib/api/map-history";

export const authKeys = {
  all: ["auth"],
  session: () => [...authKeys.all, "session"],
  teams: () => [...authKeys.all, "teams"],
};

export const teamKeys = {
  all: ["teams"],
  list: () => [...teamKeys.all, "list"],
  detail: (teamId) => [...teamKeys.all, "detail", String(teamId)],
};

export const envKeys = {
  all: ["environments"],
  list: (teamId) => [...envKeys.all, "list", String(teamId)],
};

export const collectionKeys = {
  all: ["collections"],
  list: (teamId) => [...collectionKeys.all, "list", String(teamId)],
};

export const conduitKeys = {
  all: ["conduits"],
  list: (teamId) => [...conduitKeys.all, "list", String(teamId)],
  runs: (teamId, conduitId) => [...conduitKeys.all, "runs", String(teamId), String(conduitId)],
};

export const historyKeys = {
  all: ["history"],
  lists: () => [...historyKeys.all, "list"],
  list: (teamId, filters = null) => [
    ...historyKeys.lists(),
    String(teamId),
    filters ? normalizeHistoryFilters(filters) : "all",
  ],
};

export const invitationKeys = {
  all: ["invitations"],
  detail: (code) => [...invitationKeys.all, String(code)],
};
