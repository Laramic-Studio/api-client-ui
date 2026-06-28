import { inviteAcceptPath, readPendingInviteCode } from "@/lib/invite-flow";

export function userIsVerified(user) {
  return Boolean(user?.emailVerified);
}

export function userIsOnboarded(user) {
  return Boolean(user?.onboarded);
}

export function authHomePath(user) {
  if (!user) return "/login";
  if (!userIsVerified(user)) return "/verify-email";

  const invitePath = inviteAcceptPath(readPendingInviteCode());
  if (invitePath) return invitePath;

  if (!userIsOnboarded(user)) return "/onboarding";
  return "/builder";
}
