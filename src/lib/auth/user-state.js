import { isOnboarded } from "@/lib/auth/onboarding";

export function userIsVerified(user) {
  return Boolean(user?.emailVerified);
}

export function userIsOnboarded(user) {
  if (!user) return false;
  return Boolean(user.onboarded || isOnboarded(user.id));
}

export function authHomePath(user) {
  if (!user) return "/login";
  if (!userIsVerified(user)) return "/verify-email";
  if (!userIsOnboarded(user)) return "/onboarding";
  return "/dashboard";
}
