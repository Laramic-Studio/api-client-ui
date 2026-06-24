import { isRequestUrlEmpty } from "@/lib/builder/url-variables";

export function mapApiExample(example) {
  if (!example) return null;
  return {
    id: example.id,
    name: example.name,
    status: example.status,
    statusText: example.statusText ?? example.status_text ?? "",
    headers: example.headers ?? {},
    body: example.body,
    url: example.url ?? "",
    method: example.method ?? "GET",
    savedAt: example.savedAt ?? example.saved_at ?? null,
    isDefault: Boolean(example.isDefault ?? example.is_default),
  };
}

export function exampleToResponse(example) {
  if (!example) return null;
  const body = example.body;
  const rawText = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  const sizeBytes = typeof Blob !== "undefined" ? new Blob([rawText]).size : rawText.length;

  return {
    status: example.status,
    statusText: example.statusText || "",
    headers: example.headers || {},
    body,
    rawText,
    url: example.url || "",
    method: example.method || "GET",
    durationMs: null,
    sizeBytes,
    ok: example.status >= 200 && example.status < 300,
    cookies: [],
    mode: "example",
    exampleId: example.id,
    exampleName: example.name,
  };
}

export function setDefaultExampleInList(examples = [], exampleId) {
  return examples.map((example) => ({
    ...example,
    isDefault: example.id === exampleId,
  }));
}

export function renameExampleInList(examples = [], exampleId, name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return examples;
  return examples.map((example) => (
    example.id === exampleId ? { ...example, name: trimmed } : example
  ));
}

export function suggestExampleName(examples = [], status = 200, statusText = "OK") {
  const base = statusText?.trim() || "OK";
  const named = `${status} ${base}`.trim();
  const existing = new Set((examples || []).map((example) => example.name));
  if (!existing.has(named)) return named;
  let i = 2;
  while (existing.has(`${named} (${i})`)) i += 1;
  return `${named} (${i})`;
}

export function defaultExampleName(examples = []) {
  const base = "Example";
  const existing = new Set((examples || []).map((example) => example.name));
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base} (${i})`)) i += 1;
  return `${base} (${i})`;
}

export function getEffectiveRequest(savedRequest, draft) {
  if (!savedRequest) return draft || null;
  if (!draft) return savedRequest;
  return { ...savedRequest, ...draft };
}

export function canSaveExampleForRequest(savedRequest, draft, response) {
  const req = getEffectiveRequest(savedRequest, draft);
  if (!req || isRequestUrlEmpty(req.url)) return false;
  return Boolean(response && response.mode !== "mock");
}

export function buildExampleFromResponse(request, response) {
  if (!request || isRequestUrlEmpty(request.url)) return null;
  if (!response || response.mode === "mock") return null;

  return {
    name: defaultExampleName(request.examples),
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    body: response.body,
    url: response.url || request.url,
    method: response.method || request.method,
  };
}
