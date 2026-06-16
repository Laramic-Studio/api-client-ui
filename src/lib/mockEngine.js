// Variable interpolation supports BOTH [[VAR]] (new preferred) and {{VAR}} (legacy)
import { uuidV4 } from "@/lib/generators";

// Regex matches [[VAR]] preferred, also accepts {{VAR}} for backward compat
const INTERPOLATION_RE = /\[\[\s*([A-Z0-9_]+)\s*\]\]|\{\{\s*([A-Z0-9_]+)\s*\}\}/gi;

function interpolate(str, env) {
  if (!str) return "";
  return str.replace(INTERPOLATION_RE, (_m, k1, k2) => {
    const k = k1 || k2;
    const v = env?.variables?.find((x) => x.enabled !== false && x.key === k);
    return v ? v.value : `[[${k}]]`;
  });
}

/** Add http:// when the user types localhost:3000/path without a scheme. */
function normalizeSendUrl(url) {
  const trimmed = String(url ?? "").trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return trimmed;
}

const SUCCESS_BODIES = {
  GET: ({ pathParts }) => {
    if (pathParts.includes("users")) {
      return {
        success: true,
        count: 3,
        data: [
          { id: 1, name: "Aarav Mehta", email: "aarav@noidr.dev", role: "admin", createdAt: "2025-11-04T09:21:00Z" },
          { id: 2, name: "Sara Kim", email: "sara@noidr.dev", role: "developer", createdAt: "2025-12-12T15:08:00Z" },
          { id: 3, name: "Lucas Silva", email: "lucas@noidr.dev", role: "viewer", createdAt: "2026-01-22T11:42:00Z" },
        ],
      };
    }
    if (pathParts.includes("orders")) {
      return {
        success: true,
        data: [
          { id: "ord_9F2X", total: 129.0, currency: "USD", status: "paid" },
          { id: "ord_1A8K", total: 49.5, currency: "USD", status: "pending" },
        ],
      };
    }
    if (pathParts.includes("auth")) {
      return { success: true, token: "eyJhbGciOiJIUzI1NiJ9." + uuidV4(), expiresIn: 3600 };
    }
    return { success: true, message: "OK", data: { id: 1, ref: uuidV4() } };
  },
  POST: () => ({ success: true, message: "Resource created", data: { id: Math.floor(Math.random() * 9999), ref: uuidV4() } }),
  PUT: () => ({ success: true, message: "Resource updated", data: { id: 1, updated: true } }),
  PATCH: () => ({ success: true, message: "Resource patched", data: { id: 1, patched: true } }),
  DELETE: () => ({ success: true, message: "Resource deleted" }),
  OPTIONS: () => ({ success: true, allow: ["GET", "POST", "PUT", "PATCH", "DELETE"] }),
  HEAD: () => ({}),
  WS: ({ url }) => ({
    protocol: "websocket",
    state: "connected",
    handshake: { url, subprotocol: "json-rpc.v2" },
    messages: [
      { ts: new Date().toISOString(), direction: "recv", payload: { type: "welcome", clientId: uuidV4() } },
      { ts: new Date().toISOString(), direction: "recv", payload: { type: "tick", value: Math.random().toFixed(4) } },
    ],
  }),
  SSE: ({ url }) => ({
    protocol: "sse",
    url,
    events: [
      { event: "open", data: "stream started" },
      { event: "message", data: { id: 1, body: "hello" } },
      { event: "message", data: { id: 2, body: "world" } },
    ],
  }),
  GRPC: ({ url }) => ({
    protocol: "grpc",
    service: url.split("/").filter(Boolean).pop() || "UsersService",
    method: "ListUsers",
    status: "OK",
    deadline_ms: 30000,
    response: { users: [{ id: 1, name: "Aarav" }, { id: 2, name: "Sara" }] },
  }),
};

const ERROR_BODIES = {
  400: { success: false, error: "Bad Request", message: "Invalid payload" },
  401: { success: false, error: "Unauthorized", message: "Missing or invalid token" },
  404: { success: false, error: "Not Found", message: "Resource does not exist" },
  500: { success: false, error: "Internal Server Error", message: "Something went wrong" },
};

export async function runMockRequest({ method, url, headers = [], body, env, mode = "mock" }) {
  const fullUrl = normalizeSendUrl(interpolate(url, env));
  const t0 = performance.now();

  if (mode === "real") {
    if (!fullUrl?.trim()) {
      const ms = Math.round(performance.now() - t0);
      return {
        ok: false,
        status: 0,
        statusText: "Invalid URL",
        durationMs: ms,
        sizeBytes: 0,
        headers: {},
        cookies: [],
        body: { success: false, error: "Invalid URL", message: "Request URL is empty." },
        rawText: "",
        url: fullUrl,
        method,
        mode: "real",
      };
    }

    if (!/^https?:\/\//i.test(fullUrl)) {
      const ms = Math.round(performance.now() - t0);
      return {
        ok: false,
        status: 0,
        statusText: "Invalid URL",
        durationMs: ms,
        sizeBytes: 0,
        headers: {},
        cookies: [],
        body: {
          success: false,
          error: "Invalid URL",
          message: "URL must start with http:// or https:// (e.g. http://localhost:8000/path)",
        },
        rawText: "",
        url: fullUrl,
        method,
        mode: "real",
      };
    }

    try {
      const hdrs = {};
      headers.filter((h) => h.enabled !== false && h.key).forEach((h) => (hdrs[h.key] = interpolate(h.value, env)));
      const init = { method, headers: hdrs };
      if (body && body.type === "json" && body.content && !["GET", "HEAD"].includes(method)) {
        init.body = interpolate(body.content, env);
        if (!hdrs["Content-Type"]) hdrs["Content-Type"] = "application/json";
      }
      const resp = await fetch(fullUrl, init);
      const text = await resp.text();
      const ms = Math.round(performance.now() - t0);
      let parsed = text;
      try { parsed = JSON.parse(text); } catch (_) { /* keep as text */ }
      const respHeaders = {};
      resp.headers.forEach((v, k) => { respHeaders[k] = v; });
      return {
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText || (resp.ok ? "OK" : "Error"),
        durationMs: ms,
        sizeBytes: new Blob([text]).size,
        headers: respHeaders,
        cookies: parseCookies(resp.headers.get("set-cookie")),
        body: parsed,
        rawText: text,
        url: fullUrl,
        method,
        mode: "real",
      };
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      return {
        ok: false, status: 0, statusText: "Network Error",
        durationMs: ms, sizeBytes: 0, headers: {}, cookies: [],
        body: { success: false, error: "Network Error", message: String(e?.message || e) },
        rawText: "", url: fullUrl, method, mode: "real",
      };
    }
  }

  if (mode === "real") {
    const ms = Math.round(performance.now() - t0);
    return {
      ok: false,
      status: 0,
      statusText: "Request Failed",
      durationMs: ms,
      sizeBytes: 0,
      headers: {},
      cookies: [],
      body: { success: false, error: "Request Failed", message: "Could not complete request." },
      rawText: "",
      url: fullUrl,
      method,
      mode: "real",
    };
  }

  const delay = 60 + Math.floor(Math.random() * 380);
  await new Promise((r) => setTimeout(r, delay));

  const pathParts = (fullUrl.split("?")[0] || "").split("/").filter(Boolean);
  let status = 200;
  let respBody;
  const r = Math.random();
  if (method === "POST") status = 201;
  if (method === "DELETE") status = Math.random() > 0.9 ? 404 : 200;
  if (method === "HEAD") status = 200;
  if (r > 0.92) {
    status = [400, 401, 404, 500][Math.floor(Math.random() * 4)];
    respBody = ERROR_BODIES[status];
  } else {
    respBody = (SUCCESS_BODIES[method] || SUCCESS_BODIES.GET)({ pathParts });
  }

  const raw = JSON.stringify(respBody, null, 2);
  const ms = Math.round(performance.now() - t0);
  return {
    ok: status < 400,
    status,
    statusText: statusText(status),
    durationMs: ms,
    sizeBytes: new Blob([raw]).size,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-request-id": uuidV4(),
      "x-noidr-mock": "true",
      "cache-control": "no-store",
      server: "noidr-mock-engine/1.0",
    },
    cookies: [{ name: "session", value: uuidV4().slice(0, 16), path: "/", httpOnly: true }],
    body: respBody,
    rawText: raw,
    url: fullUrl,
    method,
    mode: "mock",
  };
}

function parseCookies(header) {
  if (!header) return [];
  return header.split(",").map((c) => {
    const [pair] = c.split(";");
    const [name, value] = (pair || "").split("=");
    return { name: (name || "").trim(), value: (value || "").trim(), path: "/" };
  });
}

function statusText(code) {
  return {
    200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
    301: "Moved Permanently", 302: "Found", 304: "Not Modified",
    400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
    409: "Conflict", 422: "Unprocessable Entity", 429: "Too Many Requests",
    500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable",
  }[code] || "OK";
}

export function runTests(testScript, response) {
  if (!testScript || !testScript.trim()) return [];
  const lines = testScript.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//"));
  const results = [];
  lines.forEach((line, idx) => {
    const m = line.match(/expect\((.+?)\)\.(toBe|toEqual|toBeGreaterThan|toBeLessThan)\((.+?)\)/);
    if (!m) {
      results.push({ id: idx, name: line, passed: false, error: "Unparseable assertion" });
      return;
    }
    const [, lhs, op, rhsRaw] = m;
    let lhsVal;
    try {
      // eslint-disable-next-line no-new-func
      lhsVal = new Function("response", `return ${lhs};`)(response);
    } catch (e) {
      results.push({ id: idx, name: line, passed: false, error: String(e.message) });
      return;
    }
    let rhsVal;
    try {
      // eslint-disable-next-line no-new-func
      rhsVal = new Function(`return ${rhsRaw};`)();
    } catch {
      rhsVal = rhsRaw;
    }
    let passed = false;
    if (op === "toBe") passed = lhsVal === rhsVal;
    else if (op === "toEqual") passed = JSON.stringify(lhsVal) === JSON.stringify(rhsVal);
    else if (op === "toBeGreaterThan") passed = lhsVal > rhsVal;
    else if (op === "toBeLessThan") passed = lhsVal < rhsVal;
    results.push({
      id: idx, name: line, passed,
      error: passed ? null : `Expected ${JSON.stringify(rhsVal)}, got ${JSON.stringify(lhsVal)}`,
    });
  });
  return results;
}

export { interpolate };
