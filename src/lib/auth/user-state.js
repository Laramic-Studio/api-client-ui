export function userIsVerified(user) {
  return Boolean(user?.emailVerified);
}

export function userIsOnboarded(user) {
  return Boolean(user?.onboarded);
}

export function authHomePath(user) {
  if (!user) return "/login";
  if (!userIsVerified(user)) return "/verify-email";
  if (!userIsOnboarded(user)) return "/onboarding";
  return "/dashboard";
}
