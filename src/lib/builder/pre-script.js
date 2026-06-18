import {
  createNr,
  createRequestView,
  createScriptConsole,
  createVariableScope,
} from "@/lib/builder/script-sandbox";

function cloneRequest(req) {
  return {
    method: req.method || "GET",
    url: req.url || "",
    params: JSON.parse(JSON.stringify(req.params || [])),
    headers: JSON.parse(JSON.stringify(req.headers || [])),
    auth: JSON.parse(JSON.stringify(req.auth || { type: "none" })),
    body: JSON.parse(JSON.stringify(req.body || { type: "none", content: "" })),
  };
}

/**
 * Runs a Postman-style pre-request script. Mutations apply to the returned
 * snapshot only — the saved draft is not modified unless env vars are persisted.
 */
export function runPreRequestScript(req, env, script, { onEnvSet } = {}) {
  const trimmed = (script || "").trim();
  if (!trimmed) {
    return { request: req, env, logs: [] };
  }

  const request = cloneRequest(req);
  const logs = [];
  const variables = createVariableScope(env, { onSet: onEnvSet });
  const requestView = createRequestView(request);
  const console = createScriptConsole((entry) => logs.push({ phase: "pre", ...entry }));
  const nr = createNr({ variables, request: requestView });

  try {
    // eslint-disable-next-line no-new-func
    const runner = new Function(
      "nr",
      "variables",
      "varibles",
      "request",
      "console",
      trimmed,
    );
    runner(nr, variables, variables, requestView, console);
  } catch (err) {
    const error = new Error(err?.message || "Pre-request script failed.");
    error.logs = logs;
    throw error;
  }

  const mergedEnv = variables.toEnv(env);

  return {
    request: {
      ...req,
      method: request.method ?? req.method,
      url: request.url ?? req.url,
      params: request.params ?? req.params,
      headers: request.headers ?? req.headers,
      auth: request.auth ?? req.auth,
      body: request.body ?? req.body,
    },
    env: mergedEnv,
    logs,
  };
}
