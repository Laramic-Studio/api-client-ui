export function teamToWorkspace(team) {
  return {
    id: String(team.id),
    name: team.name,
    slug: team.slug,
    isPersonal: Boolean(team.isPersonal ?? team.is_personal),
    teamSize: team.teamSize ?? team.team_size ?? null,
    logoUrl: team.logoUrl ?? team.logo_url ?? null,
    description: "",
    members: team.membersCount ?? team.members_count ?? 1,
    createdAt: Date.now(),
  };
}

export function mapApiUser(apiUser, currentTeam) {
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    name: apiUser.name,
    avatar: null,
    provider: "password",
    accountType: apiUser.account_type || null,
    onboarded: Boolean(apiUser.onboarded_at),
    emailVerified: Boolean(apiUser.email_verified),
    createdAt: Date.now(),
  };
}
