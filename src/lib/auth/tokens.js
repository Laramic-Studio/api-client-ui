const TOKEN_KEY = "noidr-access-token";
const REMEMBER_KEY = "noidr-remember-auth";

function storage(persistent) {
  return persistent ? localStorage : sessionStorage;
}

export function getRememberAuth() {
  return localStorage.getItem(REMEMBER_KEY) === "1";
}

export function setRememberAuth(remember) {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, "1");
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

export function getAccessToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    null
  );
}

export function setAccessToken(token, { remember = true } = {}) {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  storage(remember).setItem(TOKEN_KEY, token);
  setRememberAuth(remember);
}

export function clearAccessToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}
