import { getOnboarding } from "@/lib/auth/onboarding";

export function teamToWorkspace(team) {
  return {
    id: String(team.id),
    name: team.name,
    slug: team.slug,
    isPersonal: Boolean(team.isPersonal ?? team.is_personal),
    description: "",
    members: team.membersCount ?? team.members_count ?? 1,
    createdAt: Date.now(),
  };
}

export function mapApiUser(apiUser, currentTeam) {
  const onboarding = getOnboarding(String(apiUser.id));
  const isPersonal = Boolean(currentTeam?.isPersonal ?? currentTeam?.is_personal);

  return {
    id: String(apiUser.id),
    email: apiUser.email,
    name: apiUser.name,
    avatar: null,
    provider: "password",
    accountType: onboarding?.accountType || (isPersonal ? "individual" : "company"),
    company: onboarding?.company || null,
    onboarded: Boolean(onboarding?.completed),
    emailVerified: Boolean(apiUser.email_verified),
    createdAt: Date.now(),
  };
}
