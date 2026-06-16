function mapBodyFromApi(request) {
  const bodyType = request.bodyType || request.body_type || "none";

  if (bodyType === "form") {
    return {
      type: "form",
      content: "",
      formRows: request.formData || request.form_data || [],
    };
  }

  return {
    type: bodyType,
    content: request.body ?? "",
  };
}

export function mapApiRequest(request) {
  return {
    id: request.id,
    name: request.name,
    method: request.method,
    url: request.url || "[[BASE_URL]]/",
    params: request.params || [],
    headers: request.headers || [],
    auth: request.auth?.type ? request.auth : { type: "none" },
    body: mapBodyFromApi(request),
    tests: request.tests || "",
    preScript: request.preScript || request.pre_script || "",
    starred: Boolean(request.starred),
    docs: request.description || "",
    examples: request.examples || [],
    folderId: request.folderId ?? request.folder_id ?? null,
    order: request.order ?? request.sortOrder ?? request.sort_order ?? 0,
  };
}

export function mapRequestToApi(patch) {
  const payload = {};

  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.method !== undefined) payload.method = patch.method;
  if (patch.url !== undefined) payload.url = patch.url;
  if (patch.params !== undefined) payload.params = patch.params;
  if (patch.headers !== undefined) payload.headers = patch.headers;
  if (patch.auth !== undefined) payload.auth = patch.auth;
  if (patch.tests !== undefined) payload.tests = patch.tests;
  if (patch.preScript !== undefined) payload.pre_script = patch.preScript;
  if (patch.docs !== undefined) payload.description = patch.docs;
  if (patch.starred !== undefined) payload.starred = patch.starred;
  if (patch.folderId !== undefined) payload.folder_id = patch.folderId;
  if (patch.order !== undefined) payload.sort_order = patch.order;
  if (patch.examples !== undefined) payload.examples = patch.examples;

  if (patch.body !== undefined) {
    payload.body = patch.body;
  }

  return payload;
}

export function mapExampleToApi(example) {
  return {
    name: example.name,
    status: example.status,
    statusText: example.statusText || example.status_text || "",
    headers: example.headers || {},
    body: example.body,
    url: example.url,
    method: example.method,
  };
}

// Re-export for collections map
export { mapApiRequest as mapApiRequestSummary };
