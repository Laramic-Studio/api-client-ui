import { authHomePath } from "@/lib/auth/user-state";

/** Post-auth redirect based on verification and onboarding state. */
export function authDestination(user, from) {
  if (from) return from;
  return authHomePath(user);
}
