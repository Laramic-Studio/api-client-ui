export function mapApiConduitStep(step) {
  return {
    id: step.id,
    requestId: step.request_id ?? step.requestId ?? null,
    name: step.name,
    method: step.method,
    url: step.url ?? "",
    headers: step.headers || [],
    body: step.body || { type: "none", content: "" },
    auth: step.auth?.type ? step.auth : { type: "none" },
    params: step.params || [],
    extract: step.extract || "",
    sortOrder: step.sort_order ?? step.sortOrder ?? 0,
  };
}

export function mapApiConduit(conduit) {
  return {
    id: conduit.id,
    name: conduit.name,
    sortOrder: conduit.sort_order ?? conduit.sortOrder ?? 0,
    steps: (conduit.steps || []).map(mapApiConduitStep).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function mapConduitStepToApi(step, index) {
  return {
    id: step.id || undefined,
    request_id: step.requestId || null,
    name: step.name,
    method: step.method,
    url: step.url ?? "",
    headers: step.headers || [],
    body: step.body || { type: "none", content: "" },
    auth: step.auth || { type: "none" },
    extract: step.extract || null,
    sort_order: step.sortOrder ?? index,
  };
}

export function mapConduitToApi(patch) {
  const payload = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  if (patch.steps !== undefined) {
    payload.steps = patch.steps.map(mapConduitStepToApi);
  }
  return payload;
}

export function requestToConduitStep(request) {
  return {
    id: undefined,
    requestId: request.id,
    name: request.name,
    method: request.method,
    url: request.url ?? "",
    headers: request.headers || [],
    body: request.body || { type: "none", content: "" },
    auth: request.auth || { type: "none" },
    params: request.params || [],
    extract: "",
  };
}
