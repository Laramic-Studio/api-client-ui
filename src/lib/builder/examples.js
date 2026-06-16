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
