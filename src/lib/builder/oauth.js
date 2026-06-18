import { interpolate } from "@/lib/mockEngine";
import { fetchOAuthToken } from "@/lib/api/oauth-api";
import { useAppStore } from "@/store/useAppStore";

const TOKEN_BUFFER_MS = 30_000;

function defaultOAuthAuth() {
  return {
    type: "oauth2",
    grantType: "client_credentials",
    tokenUrl: "",
    clientId: "",
    clientSecret: "",
    scope: "",
    accessToken: "",
    refreshToken: "",
    expiresAt: null,
  };
}

export function normalizeOAuthAuth(auth) {
  if (!auth || auth.type !== "oauth2") return auth;
  return { ...defaultOAuthAuth(), ...auth };
}

function hasValidCachedToken(auth) {
  return Boolean(
    auth.accessToken
    && auth.expiresAt
    && auth.expiresAt > Date.now() + TOKEN_BUFFER_MS,
  );
}

function buildTokenPayload(auth, env, grantType) {
  const payload = {
    grant_type: grantType,
    token_url: interpolate(auth.tokenUrl || "", env),
    client_id: interpolate(auth.clientId || "", env),
    client_secret: interpolate(auth.clientSecret || "", env),
    scope: interpolate(auth.scope || "", env) || undefined,
  };

  if (grantType === "refresh_token") {
    payload.refresh_token = interpolate(auth.refreshToken || "", env);
  }

  return payload;
}

function applyTokenResponse(auth, token) {
  const expiresIn = Number(token.expires_in || 3600);
  return {
    ...auth,
    accessToken: token.access_token,
    refreshToken: token.refresh_token || auth.refreshToken || "",
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

export function isOAuthConfigured(auth, env) {
  if (!auth || auth.type !== "oauth2") return false;
  const normalized = normalizeOAuthAuth(auth);
  if (hasValidCachedToken(normalized)) return true;
  const tokenUrl = interpolate(normalized.tokenUrl || "", env).trim();
  const clientId = interpolate(normalized.clientId || "", env).trim();
  return Boolean(tokenUrl && clientId);
}

export async function fetchOAuthAccessToken(auth, env, teamId = null) {
  const normalized = normalizeOAuthAuth(auth);
  const workspaceId = teamId || useAppStore.getState().activeWorkspaceId;
  if (!workspaceId) {
    throw new Error("Select a workspace before using OAuth 2.0.");
  }
  if (!normalized.tokenUrl?.trim()) {
    throw new Error("OAuth token URL is required.");
  }
  if (!normalized.clientId?.trim()) {
    throw new Error("OAuth client ID is required.");
  }

  const grantType = normalized.grantType === "refresh_token" ? "refresh_token" : "client_credentials";
  const data = await fetchOAuthToken(workspaceId, buildTokenPayload(normalized, env, grantType));
  return applyTokenResponse(normalized, data.token || data);
}

export async function ensureOAuthAuth(auth, env, teamId = null) {
  if (!auth || auth.type !== "oauth2") return auth;

  if (!isOAuthConfigured(auth, env)) {
    return auth;
  }

  const normalized = normalizeOAuthAuth(auth);

  if (hasValidCachedToken(normalized)) {
    return normalized;
  }

  const canRefresh = Boolean(
    normalized.refreshToken
    && normalized.expiresAt
    && normalized.expiresAt <= Date.now() + TOKEN_BUFFER_MS,
  );

  if (canRefresh) {
    try {
      return await fetchOAuthAccessToken(
        { ...normalized, grantType: "refresh_token" },
        env,
        teamId,
      );
    } catch {
      // Fall through to client credentials when refresh fails.
    }
  }

  return fetchOAuthAccessToken(normalized, env, teamId);
}

export function oauthStatusLabel(auth) {
  const normalized = normalizeOAuthAuth(auth);
  if (!normalized.accessToken) return "No token cached — fetch or send to acquire.";
  if (!normalized.expiresAt) return "Access token cached.";
  if (normalized.expiresAt <= Date.now()) return "Token expired — will refresh on send.";
  const mins = Math.max(1, Math.round((normalized.expiresAt - Date.now()) / 60_000));
  return `Token valid for ~${mins} min.`;
}
