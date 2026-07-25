import { apiRequest } from "@/lib/api/http";
import { setAccessToken } from "@/lib/auth/tokens";
import { API_URL } from "@/lib/config";

export async function register({
  name,
  email,
  password,
  password_confirmation,
  invite_code,
  remember = true,
}) {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: {
      name,
      email,
      password,
      password_confirmation,
      ...(invite_code ? { invite_code } : {}),
    },
  });

  setAccessToken(data.access_token, { remember });
  return data;
}

export async function login({ email, password, remember = true }) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });

  setAccessToken(data.access_token, { remember });
  return data;
}

export async function forgotPassword({ email }) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword({ token, email, password, password_confirmation }) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: { token, email, password, password_confirmation },
  });
}

export async function verifyEmail({ code }) {
  return apiRequest("/auth/email/verify", {
    method: "POST",
    body: { code },
  });
}

export async function resendVerificationEmail() {
  return apiRequest("/auth/email/resend", { method: "POST" });
}

export async function logout() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch {
    // Treat as logged out even if token already invalid.
  }
}

export async function me() {
  return apiRequest("/auth/me");
}

export async function updateProfile({ name, email }) {
  return apiRequest("/auth/me", {
    method: "PATCH",
    body: { name, email },
  });
}

export async function updatePassword({ current_password, password, password_confirmation }) {
  return apiRequest("/auth/me/password", {
    method: "PUT",
    body: { current_password, password, password_confirmation },
  });
}

export async function listTeams() {
  const data = await apiRequest("/teams");
  return data.teams || [];
}

export async function switchTeam(teamId) {
  return apiRequest(`/teams/${teamId}/switch`, { method: "POST" });
}

export async function issueDesktopAuthCode({ code_challenge, state, redirect_uri }) {
  return apiRequest("/auth/desktop/code", {
    method: "POST",
    body: { code_challenge, state, redirect_uri },
  });
}

export async function exchangeOAuthCode({ code, state }) {
  const data = await apiRequest("/auth/oauth/exchange", {
    method: "POST",
    body: { code, state },
  });
  setAccessToken(data.access_token, { remember: true });
  return data;
}

/**
 * Start Google/GitHub OAuth by navigating to the API redirect endpoint.
 * @param {'google' | 'github'} provider
 * @param {{ state?: string, frontendRedirect?: string }} [options]
 */
export function startSocialRedirect(provider, options = {}) {
  const target = new URL(`${API_URL}/auth/${provider}/redirect`);
  if (options.state) target.searchParams.set("state", options.state);
  target.searchParams.set(
    "frontend_redirect",
    options.frontendRedirect || `${window.location.origin}/auth/oauth/callback`,
  );
  window.location.assign(target.toString());
}
