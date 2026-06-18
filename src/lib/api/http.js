import axios from "axios";
import { API_URL } from "@/lib/config";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth/tokens";
import { useAppStore } from "@/store/useAppStore";

export class ApiError extends Error {
  constructor(message, { status, payload, cancelled } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.cancelled = Boolean(cancelled);
  }
}

let refreshPromise = null;

export function createAbortController() {
  return new AbortController();
}

export function isCancelledError(error) {
  if (error instanceof ApiError) return error.cancelled;
  if (axios.isCancel(error)) return true;
  if (error?.name === "AbortError") return true;
  const message = String(error?.message || "").toLowerCase();
  return message.includes("aborted") || message.includes("cancel");
}

function toApiError(error) {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error)) {
    return new ApiError("Request cancelled.", {
      status: 0,
      cancelled: true,
      payload: { cause: error.message },
    });
  }

  if (error.response) {
    const payload = error.response.data;
    return new ApiError(
      payload?.message || `Request failed (${error.response.status})`,
      { status: error.response.status, payload }
    );
  }

  const base = error.config?.baseURL || API_URL;
  return new ApiError(
    `Cannot reach the API (${base}). Make sure the backend is running.`,
    { status: 0, payload: { cause: error.message } }
  );
}

async function refreshAccessToken() {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const { data } = await api.post("/auth/refresh", null, {
      headers: { Authorization: `Bearer ${token}` },
      _skipAuthRefresh: true,
    });
    if (!data?.access_token) return null;
    setAccessToken(data.access_token, { remember: true });
    return data.access_token;
  } catch {
    return null;
  }
}

/** Primary axios instance for noidr-api (noidr.dev/api). */
export const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json" },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || config._skipAuthRefresh) {
      return Promise.reject(toApiError(error));
    }

    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        config.headers.Authorization = `Bearer ${refreshed}`;
        return api.request(config);
      }

      clearAccessToken();
      useAppStore.getState().clearAuthSession();
      return Promise.reject(
        new ApiError("Session expired. Please sign in again.", { status: 401 })
      );
    }

    return Promise.reject(toApiError(error));
  }
);

/**
 * Create an axios client for other backends (e.g. AI service).
 * Does not attach noidr JWT interceptors.
 */
export function createApiClient(baseURL, { timeout = 60_000 } = {}) {
  const client = axios.create({
    baseURL: (baseURL || "").replace(/\/$/, ""),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    timeout,
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(toApiError(error))
  );

  return client;
}

/**
 * Thin wrapper kept for existing call sites.
 * Supports AbortController via `signal`.
 */
export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    signal,
    headers,
    params,
    timeout,
    responseType,
  } = options;

  try {
    const { data } = await api.request({
      url: path,
      method,
      data: body,
      signal,
      headers,
      params,
      timeout,
      responseType,
    });
    return data;
  } catch (error) {
    throw error instanceof ApiError ? error : toApiError(error);
  }
}
