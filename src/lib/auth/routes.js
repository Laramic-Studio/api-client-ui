import { authHomePath, userIsOnboarded, userIsVerified } from "@/lib/auth/user-state";
import { inviteAcceptPath, readPendingInviteCode } from "@/lib/invite-flow";

/** Post-auth redirect based on verification, onboarding, and pending invites. */
export function authDestination(user, from) {
  if (from) return from;

  const pendingInvite = readPendingInviteCode();
  const invitePath = inviteAcceptPath(pendingInvite);

  if (!userIsVerified(user)) {
    return "/verify-email";
  }

  if (invitePath) {
    return invitePath;
  }

  if (!userIsOnboarded(user)) {
    return "/onboarding";
  }

  return authHomePath(user);
}
