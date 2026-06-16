import { getClient } from "@/lib/api/client";
import { interpolate } from "@/lib/mockEngine";
import { extractByPath, substituteConduitVars } from "@/lib/conduits/variables";

function buildHeaders(node, env) {
  const headers = [...(node.headers || [])];
  const auth = node.auth || { type: "none" };

  if (auth.type === "bearer" && auth.token) {
    headers.push({
      key: "Authorization",
      value: `Bearer ${interpolate(auth.token, env)}`,
      enabled: true,
    });
  } else if (auth.type === "basic" && auth.username) {
    const cred = btoa(`${auth.username}:${auth.password || ""}`);
    headers.push({ key: "Authorization", value: `Basic ${cred}`, enabled: true });
  } else if (auth.type === "apikey") {
    headers.push({
      key: auth.headerName || "X-API-Key",
      value: interpolate(auth.value || "", env),
      enabled: true,
    });
  }

  return headers;
}

function buildUrl(node, env, flowVars) {
  const withEnv = interpolate(node.url || "", env);
  const base = substituteConduitVars(withEnv, flowVars);
  const qs = (node.params || [])
    .filter((p) => p.enabled !== false && p.key)
    .map((p) => {
      const value = substituteConduitVars(interpolate(p.value, env), flowVars);
      return `${encodeURIComponent(p.key)}=${encodeURIComponent(value)}`;
    })
    .join("&");
  return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
}

function serializeVar(value) {
  if (value == null) return value;
  return typeof value === "object" ? value : value;
}

/**
 * Run a conduit flow sequentially. Each step sends a real HTTP request,
 * extracts variables from responses, and passes them to later steps.
 */
export async function runConduit({ steps, env, mode = "real", onStepComplete }) {
  const client = getClient();
  const flowVars = {};
  const results = [];
  let success = true;

  for (const node of steps) {
    const url = buildUrl(node, env, flowVars);
    const headers = buildHeaders(node, env).map((h) => ({
      ...h,
      value: substituteConduitVars(interpolate(h.value || "", env), flowVars),
    }));

    const body = node.body?.content
      ? {
          ...node.body,
          content: substituteConduitVars(interpolate(node.body.content, env), flowVars),
        }
      : node.body;

    const response = await client.send({
      method: node.method || "GET",
      url,
      headers,
      body,
      env,
      mode,
    });

    let extracted = null;
    if (node.extract && response.body != null) {
      const value = extractByPath(response.body, node.extract);
      if (value !== undefined) {
        flowVars[node.extract] = serializeVar(value);
        extracted = { path: node.extract, value };
      }
    }

    const stepResult = {
      nodeId: node.id,
      name: node.name,
      method: node.method,
      url,
      response,
      extracted,
      ok: response.ok,
    };
    results.push(stepResult);
    onStepComplete?.(stepResult);

    if (!response.ok) {
      success = false;
      break;
    }
  }

  return { success, steps: results, variables: flowVars };
}
