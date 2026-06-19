import { docsToPlainText } from "@/lib/docs/format";

const MAX_BODY = 4000;
const MAX_SCRIPT = 2000;
const MAX_DOCS = 1000;

export function truncateText(text, max = MAX_BODY) {
  const s = String(text ?? "");
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n… (truncated)`;
}

export function redactAuth(auth) {
  if (!auth || auth.type === "none") return { type: "none" };
  const safe = { type: auth.type };
  if (auth.type === "bearer") safe.hasToken = Boolean(auth.token || auth.bearer);
  if (auth.type === "basic") safe.hasCredentials = Boolean(auth.username);
  if (auth.type === "apikey") {
    safe.in = auth.in;
    safe.keyName = auth.key;
  }
  return safe;
}

export function summarizeKvRows(rows) {
  return (rows || [])
    .filter((r) => r.key)
    .map((r) => ({ key: r.key, value: r.value || "", enabled: r.enabled !== false }));
}

export function summarizeRequestForAi(req, { includeScripts = true } = {}) {
  if (!req) return null;
  return {
    id: req.id,
    name: req.name,
    method: req.method,
    url: req.url,
    collectionId: req.collectionId,
    params: summarizeKvRows(req.params),
    headers: summarizeKvRows(req.headers),
    auth: redactAuth(req.auth),
    body: req.body
      ? { type: req.body.type, content: truncateText(req.body.content) }
      : { type: "none", content: "" },
    ...(includeScripts && {
      preScript: truncateText(req.preScript, MAX_SCRIPT),
      tests: truncateText(req.tests, MAX_SCRIPT),
      docs: truncateText(docsToPlainText(req.docs), MAX_DOCS),
    }),
  };
}

function formatResponseBody(response) {
  if (typeof response?.body === "string") return response.body;
  if (response?.body == null) return response?.rawText || "";
  try {
    return JSON.stringify(response.body, null, 2);
  } catch {
    return String(response.body);
  }
}

export function summarizeResponseForAi(response) {
  if (!response) return null;
  return {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    durationMs: response.durationMs,
    url: response.url,
    method: response.method,
    headers: response.headers || {},
    bodyPreview: truncateText(formatResponseBody(response)),
    corsBlocked: Boolean(response.corsBlocked),
    mode: response.mode,
  };
}

export function summarizeCollectionsForAi(collections) {
  return (collections || []).map((c) => ({
    id: c.id,
    name: c.name,
    archived: Boolean(c.archived),
    requestCount: (c.requests || []).length,
    requests: (c.requests || []).map((r) => summarizeRequestForAi(r)),
  }));
}

export function summarizeConduitsForAi(conduits) {
  return (conduits || []).map((c) => ({
    id: c.id,
    name: c.name,
    stepCount: c.steps?.length || 0,
    edgeCount: c.layout?.edges?.length || 0,
    steps: (c.steps || []).map((s) => ({
      id: s.id,
      name: s.name,
      method: s.method,
      url: s.url,
    })),
  }));
}

export function summarizeConduitStepForAi(step) {
  return {
    id: step.id,
    name: step.name,
    method: step.method,
    url: step.url,
    requestId: step.requestId,
    extractions: (step.extractions || []).map((ext) => ({
      path: ext.path,
      variable: ext.variable,
      passes: ext.passes || [],
    })),
    condition: step.condition,
    sortOrder: step.sortOrder,
  };
}

export function summarizeTestResultsForAi(testResults) {
  if (!testResults) return null;
  return {
    passed: testResults.passed,
    failed: testResults.failed,
    total: testResults.total,
    results: (testResults.results || []).slice(0, 12).map((r) => ({
      name: r.name,
      passed: r.passed,
      error: r.error || null,
    })),
  };
}
