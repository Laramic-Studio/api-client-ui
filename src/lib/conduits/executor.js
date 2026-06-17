import { getClient } from "@/lib/api/client";
import { interpolate } from "@/lib/mockEngine";
import { evaluateCondition } from "@/lib/conduits/conditions";
import { buildOutgoingMap, getExecutionOrder, getPassTargets } from "@/lib/conduits/step-utils";
import {
  applyPassesToStep,
  applyVarSubstitutions,
  collectPendingPasses,
} from "@/lib/conduits/passes";
import { extractByPath, substituteConduitVars } from "@/lib/conduits/variables";

function buildHeaders(node, env, flowVars) {
  const headers = [...(node.headers || [])];
  const auth = node.auth || { type: "none" };

  if (auth.type === "bearer" && auth.token) {
    headers.push({
      key: "Authorization",
      value: `Bearer ${substituteConduitVars(interpolate(auth.token, env), flowVars)}`,
      enabled: true,
    });
  } else if (auth.type === "basic" && auth.username) {
    const cred = btoa(`${auth.username}:${auth.password || ""}`);
    headers.push({ key: "Authorization", value: `Basic ${cred}`, enabled: true });
  } else if (auth.type === "apikey") {
    headers.push({
      key: auth.headerName || "X-API-Key",
      value: substituteConduitVars(interpolate(auth.value || "", env), flowVars),
      enabled: true,
    });
  }

  return headers;
}

function buildUrl(node, env, flowVars) {
  const base = substituteConduitVars(interpolate(node.url || "", env), flowVars);
  const qs = (node.params || [])
    .filter((p) => p.enabled !== false && p.key)
    .map((p) => {
      const value = substituteConduitVars(interpolate(p.value, env), flowVars);
      return `${encodeURIComponent(p.key)}=${encodeURIComponent(value)}`;
    })
    .join("&");
  return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
}

function normalizeExtractions(step) {
  if (step.extractions?.length) return step.extractions;
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

function snapshotBody(response) {
  if (!response) return null;
  const raw = response.rawText;
  if (raw && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  const body = response.body;
  if (body == null) return null;
  if (typeof body === "string") return body;
  return body;
}

function snapshotHeaders(headers) {
  if (!headers || typeof headers !== "object") return null;
  return headers;
}

function fanOutPasses(sourceId, passes, steps, layout, outgoing, passesByTarget) {
  if (!passes.length) return;
  getPassTargets(sourceId, steps, layout, outgoing).forEach((targetId) => {
    const existing = passesByTarget.get(targetId) || [];
    passesByTarget.set(targetId, [...existing, ...passes]);
  });
}

/**
 * Run a conduit flow. Execution order follows canvas edges or sortOrder.
 * Extraction passes fan out to every directly connected downstream step.
 * Stops on first failed request; skips steps when optional conditions fail.
 */
export async function runConduit({
  steps,
  layout,
  env,
  mode = "real",
  onStepComplete,
}) {
  const client = getClient();
  const flowVars = {};
  const results = [];
  const ordered = getExecutionOrder(steps, layout);
  const outgoing = buildOutgoingMap(steps, layout);
  const passesByTarget = new Map();
  let success = true;
  let previousResponse = null;

  const startedAt = new Date().toISOString();
  const t0 = performance.now();

  for (const rawStep of ordered) {
    const conditionOk = evaluateCondition(rawStep.condition, { previousResponse, flowVars });
    if (!conditionOk) {
      const skipped = {
        stepId: rawStep.id,
        name: rawStep.name,
        method: rawStep.method,
        url: rawStep.url,
        ok: false,
        skipped: true,
        status: null,
        durationMs: 0,
        extracted: null,
        error: "Condition not met — step skipped",
        responseBody: null,
      };
      results.push(skipped);
      onStepComplete?.(skipped);
      passesByTarget.delete(rawStep.id);
      continue;
    }

    const inboundPasses = passesByTarget.get(rawStep.id) || [];
    passesByTarget.delete(rawStep.id);
    let step = applyPassesToStep(rawStep, inboundPasses, flowVars);
    step = applyVarSubstitutions(step, env, flowVars, interpolate);

    const url = buildUrl(step, env, flowVars);
    const headers = buildHeaders(step, env, flowVars).map((h) => ({
      ...h,
      value: substituteConduitVars(interpolate(h.value || "", env), flowVars),
    }));

    const body = step.body?.content
      ? {
          ...step.body,
          content: substituteConduitVars(interpolate(step.body.content, env), flowVars),
        }
      : step.body;

    const response = await client.send({
      method: step.method || "GET",
      url,
      headers,
      body,
      env,
      mode,
    });

    previousResponse = response;
    const extractions = normalizeExtractions(rawStep);
    const extractedItems = [];
    const outboundPasses = [];

    extractions.forEach((ext) => {
      if (!ext.path || response.body == null) return;
      const value = extractByPath(response.body, ext.path);
      if (value === undefined) return;
      const variable = ext.variable || ext.path.replace(/\./g, "_");
      flowVars[variable] = value;
      extractedItems.push({ path: ext.path, variable, value });
      outboundPasses.push(...collectPendingPasses([ext]));
    });

    if (response.ok) {
      fanOutPasses(rawStep.id, outboundPasses, steps, layout, outgoing, passesByTarget);
    }

    const stepResult = {
      stepId: rawStep.id,
      name: rawStep.name,
      method: step.method,
      url,
      ok: response.ok,
      skipped: false,
      status: response.status,
      durationMs: response.durationMs,
      response,
      extracted: extractedItems.length ? extractedItems : null,
      error: response.ok ? null : response.body?.message || response.statusText,
      responseBody: snapshotBody(response),
      responseHeaders: snapshotHeaders(response.headers),
      responseRaw: response.rawText || null,
    };
    results.push(stepResult);
    onStepComplete?.(stepResult);

    if (!response.ok) {
      success = false;
      break;
    }
  }

  const finishedAt = new Date().toISOString();

  return {
    success,
    steps: results,
    variables: flowVars,
    startedAt,
    finishedAt,
    durationMs: Math.round(performance.now() - t0),
  };
}

export function formatRunForApi(result, environmentId) {
  return {
    environment_id: environmentId || null,
    success: result.success,
    duration_ms: result.durationMs,
    started_at: result.startedAt,
    finished_at: result.finishedAt,
    variables: result.variables,
    steps: result.steps.map((s) => ({
      step_id: s.stepId,
      name: s.name,
      method: s.method,
      ok: s.ok,
      skipped: s.skipped,
      status: s.status,
      duration_ms: s.durationMs,
      url: s.url,
      extracted: s.extracted,
      error: s.error,
      response_body: s.responseBody,
      response_headers: s.responseHeaders,
      response_raw: s.responseRaw,
    })),
  };
}
