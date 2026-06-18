function buildEnvView(env) {
  const variables = {};
  (env?.variables || [])
    .filter((v) => v.enabled !== false && v.key)
    .forEach((v) => {
      variables[v.key] = v.value ?? "";
    });
  return { variables };
}

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
 * Runs pre-request script for a single send. Mutations apply to the returned
 * snapshot only — the saved draft is not modified.
 */
export function runPreRequestScript(req, env, script) {
  const trimmed = (script || "").trim();
  if (!trimmed) return req;

  const request = cloneRequest(req);
  const envView = buildEnvView(env);
  const logs = [];
  const console = { log: (...args) => logs.push(args.map(String).join(" ")) };

  try {
    // eslint-disable-next-line no-new-func
    const runner = new Function("env", "request", "console", `${trimmed}\nreturn request;`);
    const result = runner(envView, request, console);
    if (!result || typeof result !== "object") {
      throw new Error("Pre-request script must return the request object.");
    }
    return {
      ...req,
      method: result.method ?? req.method,
      url: result.url ?? req.url,
      params: result.params ?? req.params,
      headers: result.headers ?? req.headers,
      auth: result.auth ?? req.auth,
      body: result.body ?? req.body,
    };
  } catch (err) {
    throw new Error(err?.message || "Pre-request script failed.");
  }
}
