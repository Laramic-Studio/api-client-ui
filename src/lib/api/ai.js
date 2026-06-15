// Lightweight frontend wrapper for the AI backend endpoints.
// Backend lives at /app/backend/server.py — keys stay on the server.
const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function aiPayload(extra, ai, userId) {
  const base = { user_id: userId, ...extra };
  if (ai?.useOwnKey && ai.userKey) base.user_key = ai.userKey;
  if (ai?.provider) base.provider = ai.provider;
  if (ai?.model) base.model = ai.model;
  return base;
}

export async function aiBuildRequest({ prompt, envVars, userId, ai }) {
  const res = await fetch(`${API_BASE}/api/ai/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aiPayload({ prompt, env_vars: envVars }, ai, userId)),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI build failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.spec;
}

export async function aiExplainResponse({ method, url, status, body, headers, userId, ai, onDelta }) {
  const res = await fetch(`${API_BASE}/api/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aiPayload({ method, url, status, body, headers }, ai, userId)),
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
      } catch { /* ignore partial */ }
    }
  }
  return full;
}

export async function aiUsage(userId) {
  const res = await fetch(`${API_BASE}/api/ai/usage?user_id=${encodeURIComponent(userId || "anonymous")}`);
  if (!res.ok) return null;
  return res.json();
}
