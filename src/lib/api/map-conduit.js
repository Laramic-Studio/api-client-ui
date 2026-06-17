import { defaultPosition } from "@/lib/conduits/step-utils";

function normalizeExtractions(step) {
  if (step.extractions?.length) {
    return step.extractions.map((ext) => ({
      id: ext.id || `ext_${ext.path}`,
      path: ext.path || "",
      variable: ext.variable || (ext.path || "").replace(/\./g, "_"),
      passes: ext.passes || [],
    }));
  }
  if (step.extract) {
    return [{
      id: "legacy",
      path: step.extract,
      variable: step.extract.replace(/\./g, "_"),
      passes: [],
    }];
  }
  return [];
}

export function mapApiConduitStep(step, index = 0) {
  return {
    id: step.id,
    requestId: step.request_id ?? step.requestId ?? null,
    name: step.name,
    method: step.method,
    url: step.url ?? "",
    params: step.params || [],
    headers: step.headers || [],
    body: step.body || { type: "none", content: "" },
    auth: step.auth?.type ? step.auth : { type: "none" },
    extract: step.extract || "",
    extractions: normalizeExtractions(step),
    condition: step.condition || null,
    position: step.position || defaultPosition(index),
    sortOrder: step.sort_order ?? step.sortOrder ?? index,
  };
}

export function mapApiConduit(conduit) {
  const steps = (conduit.steps || []).map((s, i) => mapApiConduitStep(s, i));
  return {
    id: conduit.id,
    name: conduit.name,
    userId: conduit.user_id ?? conduit.userId ?? null,
    visibility: conduit.visibility || "private",
    sharedWith: conduit.shared_with ?? conduit.sharedWith ?? [],
    canEdit: conduit.can_edit ?? conduit.canEdit ?? true,
    sortOrder: conduit.sort_order ?? conduit.sortOrder ?? 0,
    layout: conduit.layout || { edges: [] },
    steps: steps.sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function mapApiConduitRunStep(step) {
  return {
    stepId: step.step_id ?? step.stepId,
    name: step.name,
    method: step.method || "GET",
    url: step.url,
    ok: step.ok,
    skipped: step.skipped,
    status: step.status,
    durationMs: step.duration_ms ?? step.durationMs ?? 0,
    extracted: step.extracted,
    error: step.error,
    responseBody: step.response_body ?? step.responseBody,
    responseHeaders: step.response_headers ?? step.responseHeaders,
    responseRaw: step.response_raw ?? step.responseRaw,
  };
}

export function mapApiConduitRun(run) {
  return {
    id: run.id,
    conduitId: run.conduit_id ?? run.conduitId,
    environmentId: run.environment_id ?? run.environmentId,
    success: run.success,
    steps: (run.steps || []).map(mapApiConduitRunStep),
    variables: run.variables || {},
    durationMs: run.duration_ms ?? run.durationMs ?? 0,
    startedAt: run.started_at ?? run.startedAt,
    finishedAt: run.finished_at ?? run.finishedAt,
    createdAt: run.created_at ?? run.createdAt,
  };
}

export function mapConduitStepToApi(step, index) {
  return {
    id: step.id || undefined,
    request_id: step.requestId || null,
    name: step.name,
    method: step.method,
    url: step.url ?? "",
    params: step.params || [],
    headers: step.headers || [],
    body: step.body || { type: "none", content: "" },
    auth: step.auth || { type: "none" },
    extract: step.extractions?.[0]?.path || step.extract || null,
    extractions: step.extractions || [],
    condition: step.condition || null,
    position: step.position || null,
    sort_order: step.sortOrder ?? index,
  };
}

export function mapConduitToApi(patch) {
  const payload = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.visibility !== undefined) payload.visibility = patch.visibility;
  if (patch.sharedWith !== undefined) payload.shared_with = patch.sharedWith;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  if (patch.layout !== undefined) payload.layout = patch.layout;
  if (patch.steps !== undefined) {
    payload.steps = patch.steps.map(mapConduitStepToApi);
  }
  return payload;
}

export function requestToConduitStep(request, index = 0) {
  return {
    requestId: request.id,
    name: request.name,
    method: request.method,
    url: request.url ?? "",
    headers: request.headers || [],
    body: request.body || { type: "none", content: "" },
    auth: request.auth || { type: "none" },
    params: request.params || [],
    extractions: [],
    condition: null,
    position: defaultPosition(index),
    sortOrder: index,
  };
}
