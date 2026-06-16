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
