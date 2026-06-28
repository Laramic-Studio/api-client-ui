import {
  emptyImportCollection,
  normalizeImportUrl,
  parseHttpMethod,
  parseKeyValueList,
} from "@/lib/import/shared";

function resolveServerUrl(data) {
  const servers = data.servers;
  if (servers?.[0]?.url) return String(servers[0].url).replace(/\/$/, "");

  const host = data.host;
  const basePath = String(data.basePath ?? "");
  if (host) {
    const hostStr = Array.isArray(host) ? host.join(".") : host;
    const schemes = data.schemes;
    const scheme = schemes?.[0] ?? "https";
    return `${scheme}://${hostStr}${basePath}`.replace(/\/$/, "");
  }
  return "";
}

function parseOpenApiPaths(paths, baseUrl, tagDescriptions) {
  const byTag = new Map();

  for (const [path, methods] of Object.entries(paths || {})) {
    if (!methods || typeof methods !== "object") continue;
    for (const [method, operation] of Object.entries(methods)) {
      if (method.startsWith("x-") || !operation || typeof operation !== "object") continue;

      const tags = Array.isArray(operation.tags) ? operation.tags : ["default"];
      const tag = tags[0] ?? "default";
      const summary = String(operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${path}`);
      const url = normalizeImportUrl(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);

      const headers = [];
      if (Array.isArray(operation.parameters)) {
        for (const param of operation.parameters) {
          if (param.in === "header") {
            headers.push({
              key: String(param.name ?? ""),
              value: String(param.schema?.default ?? ""),
              enabled: param.required !== false,
            });
          }
        }
      }

      let body = { type: "none", content: "" };
      const requestBody = operation.requestBody;
      if (requestBody?.content?.["application/json"]) {
        const json = requestBody.content["application/json"];
        const example = json.example ?? json.schema?.example;
        if (example !== undefined) {
          body = {
            type: "json",
            content: typeof example === "string" ? example : JSON.stringify(example, null, 2),
          };
        }
      }

      const request = {
        name: summary,
        method: parseHttpMethod(method),
        url,
        params: [],
        headers,
        auth: { type: "none" },
        body,
        docs: typeof operation.description === "string" ? operation.description : "",
      };

      const list = byTag.get(tag) ?? [];
      list.push(request);
      byTag.set(tag, list);
    }
  }

  if (byTag.size === 1 && byTag.has("default")) {
    return { folders: [], requests: byTag.get("default") ?? [] };
  }

  const folders = [...byTag.entries()].map(([tag, requests]) => ({
    name: tag,
    description: tagDescriptions.get(tag) ?? "",
    folders: [],
    requests,
  }));

  return { folders, requests: [] };
}

export function importOpenApiJson(data) {
  const isSwagger2 = data.swagger === "2.0";
  const isOpenApi3 = typeof data.openapi === "string" && data.openapi.startsWith("3");
  if (!isSwagger2 && !isOpenApi3) return null;

  const info = data.info || {};
  const name = info.title?.trim() || "Imported API";
  const baseUrl = resolveServerUrl(data);
  const paths = data.paths;
  if (!paths) return null;

  const tagDescriptions = new Map();
  if (Array.isArray(data.tags)) {
    for (const tag of data.tags) {
      if (tag.name && typeof tag.description === "string") {
        tagDescriptions.set(tag.name, tag.description);
      }
    }
  }

  const { folders, requests } = parseOpenApiPaths(paths, baseUrl, tagDescriptions);

  return {
    ...emptyImportCollection(name),
    name,
    description: typeof info.description === "string" ? info.description : "",
    folders,
    requests,
  };
}

/** Minimal YAML OpenAPI path parser for pasted specs without a YAML library. */
export function importOpenApiYaml(text) {
  const reqs = [];
  let currentPath = null;

  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*$/, "");
    const pathMatch = line.match(/^\s*(\/\S*):/);
    if (pathMatch) currentPath = pathMatch[1];

    const methMatch = line.match(/^\s{2,}(get|post|put|patch|delete|options|head):/i);
    if (methMatch && currentPath) {
      reqs.push({
        name: `${methMatch[1].toUpperCase()} ${currentPath}`,
        method: parseHttpMethod(methMatch[1]),
        url: normalizeImportUrl(`[[BASE_URL]]${currentPath}`),
        params: [],
        headers: [{ key: "Accept", value: "application/json", enabled: true }],
        auth: { type: "none" },
        body: { type: "none", content: "" },
        docs: "",
      });
    }
  }

  if (!reqs.length) return null;

  return {
    ...emptyImportCollection("Imported OpenAPI"),
    requests: reqs,
    folders: [],
  };
}
