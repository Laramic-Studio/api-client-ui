// Lightweight frontend wrapper for the AI backend endpoints.
import { createApiClient, createAbortController, isCancelledError } from "@/lib/api/http";

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
const aiApi = createApiClient(API_BASE);

function aiPayload(extra, ai, userId) {
  const base = { user_id: userId, ...extra };
  if (ai?.useOwnKey && ai.userKey) base.user_key = ai.userKey;
  if (ai?.provider) base.provider = ai.provider;
  if (ai?.model) base.model = ai.model;
  return base;
}

export { createAbortController, isCancelledError };

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
  const res = await fetch(`${API_BASE}/api/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aiPayload({ method, url, status, body, headers }, ai, userId)),
    signal,
  });

  if (!res.ok || !res.body) {
    const t = await res.text();
    throw new Error(`AI explain failed: ${res.status} ${t}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return full;
      try {
        const j = JSON.parse(payload);
        if (j.delta) { full += j.delta; onDelta?.(j.delta, full); }
        if (j.error) throw new Error(j.error);
      } catch {
        // ignore partial chunks
      }
    }
  }

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
