const CODE_KEY = "noidr_pending_invite_code";

export function storePendingInviteCode(code) {
  if (!code) return;
  sessionStorage.setItem(CODE_KEY, code);
}

export function readPendingInviteCode() {
  return sessionStorage.getItem(CODE_KEY);
}

export function clearPendingInvite() {
  sessionStorage.removeItem(CODE_KEY);
}

export function inviteAcceptPath(code) {
  const resolved = code || readPendingInviteCode();
  return resolved ? `/accept-invitation/${encodeURIComponent(resolved)}` : null;
}

export function loginPathForInvite(code) {
  const resolved = code || readPendingInviteCode();
  return resolved
    ? `/login?invite_code=${encodeURIComponent(resolved)}`
    : "/login";
}

export function registerPathForInvite(code) {
  const resolved = code || readPendingInviteCode();
  return resolved
    ? `/register?invite_code=${encodeURIComponent(resolved)}`
    : "/register";
}
