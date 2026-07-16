const STORAGE_KEY = "noidr-desktop-auth";

/**
 * @typedef {{ code_challenge: string, state: string, redirect_uri: string }} DesktopAuthParams
 */

/**
 * @param {URLSearchParams | { get: (k: string) => string | null }} searchParams
 * @returns {DesktopAuthParams | null}
 */
export function readDesktopParamsFromSearch(searchParams) {
  const codeChallenge = searchParams.get("code_challenge");
  const state = searchParams.get("state");
  const redirectUri = searchParams.get("redirect_uri");

  if (!codeChallenge || !redirectUri) return null;

  return {
    code_challenge: codeChallenge,
    state: state || "",
    redirect_uri: redirectUri,
  };
}

/** @param {DesktopAuthParams} params */
export function storeDesktopAuthParams(params) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
}

/** @returns {DesktopAuthParams | null} */
export function readDesktopAuthParams() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.code_challenge || !parsed?.redirect_uri) return null;
    return {
      code_challenge: parsed.code_challenge,
      state: parsed.state || "",
      redirect_uri: parsed.redirect_uri,
    };
  } catch {
    return null;
  }
}

export function clearDesktopAuthParams() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function hasDesktopAuthParams() {
  return Boolean(readDesktopAuthParams());
}

/**
 * Capture desktop PKCE params from the current URL into sessionStorage.
 * @param {URLSearchParams} searchParams
 * @returns {DesktopAuthParams | null}
 */
export function captureDesktopAuthFromSearch(searchParams) {
  const params = readDesktopParamsFromSearch(searchParams);
  if (params) storeDesktopAuthParams(params);
  return params || readDesktopAuthParams();
}

/**
 * Build the desktop callback URL with code + state.
 * @param {string} redirectUri
 * @param {string} code
 * @param {string | null | undefined} state
 */
export function buildDesktopDeepLink(redirectUri, code, state) {
  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);
  return url.toString();
}

export function isLoopbackRedirect(redirectUri) {
  try {
    const url = new URL(redirectUri);
    return url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Path for the SPA return page after issuing a desktop auth code.
 * @param {{ code: string, state?: string | null, redirect_uri: string }} payload
 */
export function desktopReturnPath(payload) {
  const q = new URLSearchParams({
    code: payload.code,
    redirect_uri: payload.redirect_uri,
  });
  if (payload.state) q.set("state", payload.state);
  return `/auth/desktop/return?${q.toString()}`;
}
