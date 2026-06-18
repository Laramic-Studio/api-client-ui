// Lightweight frontend wrapper for the AI backend endpoints.
import { createApiClient, createAbortController, isCancelledError, ApiError } from "@/lib/api/http";
import { API_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/auth/tokens";

const LEGACY_AI_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const aiApi = createApiClient(LEGACY_AI_BASE);

function aiPayload(extra, ai, userId) {
  const base = { user_id: userId, ...extra };
  if (ai?.useOwnKey && ai.userKey) base.user_key = ai.userKey;
  if (ai?.provider) base.provider = ai.provider;
  if (ai?.model) base.model = ai.model;
  return base;
}

async function readAiSseStream(res, { onDelta, onActions, signal }) {
  if (!res.ok || !res.body) {
    const t = await res.text();
    throw new Error(`AI request failed: ${res.status} ${t}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let proposedActions = [];

  for (;;) {
    if (signal?.aborted) {
      throw new ApiError("Request cancelled.", { cancelled: true });
    }
    let chunk;
    try {
      chunk = await reader.read();
    } catch (err) {
      if (signal?.aborted || err?.name === "AbortError") {
        throw new ApiError("Request cancelled.", { cancelled: true });
      }
      throw err;
    }
    const { value, done } = chunk;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return { full, proposedActions };
      try {
        const j = JSON.parse(payload);
        if (j.delta) {
          full += j.delta;
          onDelta?.(j.delta, full);
        }
        if (j.proposed_actions) {
          proposedActions = j.proposed_actions;
          onActions?.(proposedActions);
        }
        if (j.error) throw new Error(j.error);
      } catch (err) {
        if (err instanceof Error && err.message !== "Unexpected end of JSON input") {
          if (payload.startsWith("{")) throw err;
        }
      }
    }
  }

  return { full, proposedActions };
}

export { createAbortController, isCancelledError };

export async function aiChat({ messages, context, userId, ai, onDelta, onActions, signal }) {
  const token = getAccessToken();
  let res;
  try {
    res = await fetch(`${API_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(aiPayload({ messages, context }, ai, userId)),
      signal,
    });
  } catch (err) {
    if (signal?.aborted || err?.name === "AbortError") {
      throw new ApiError("Request cancelled.", { cancelled: true });
    }
    throw err;
  }

  return readAiSseStream(res, { onDelta, onActions, signal });
}

export async function aiBuildRequest({ prompt, envVars, userId, ai, signal }) {
  const { data } = await aiApi.post("/api/ai/build", aiPayload({ prompt, env_vars: envVars }, ai, userId), {
    signal,
  });
  return data.spec;
}

/**
 * SSE stream — uses fetch (axios can't stream SSE in the browser).
 * Pass `signal` from createAbortController() to cancel.
 */
export async function aiExplainResponse({
  method, url, status, body, headers, userId, ai, onDelta, signal,
}) {
  const res = await fetch(`${LEGACY_AI_BASE}/api/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aiPayload({ method, url, status, body, headers }, ai, userId)),
    signal,
  });

  const { full } = await readAiSseStream(res, { onDelta, signal });
  return full;
}

export async function aiUsage(userId, { signal } = {}) {
  try {
    const { data } = await aiApi.get("/api/ai/usage", {
      params: { user_id: userId || "anonymous" },
      signal,
    });
    return data;
  } catch {
    return null;
  }
}
