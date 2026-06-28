const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);

export function parseHttpMethod(value, fallback = "GET") {
  const method = String(value ?? fallback).toUpperCase();
  return HTTP_METHODS.has(method) ? method : fallback;
}

export function parseKeyValueList(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const key = String(item.key ?? item.name ?? "").trim();
      if (!key) return null;
      return {
        key,
        value: String(item.value ?? ""),
        enabled: item.disabled !== true && item.enabled !== false,
      };
    })
    .filter(Boolean);
}

export function postmanUrlToString(url) {
  if (typeof url === "string") return url.trim();
  if (!url || typeof url !== "object") return "";
  if (typeof url.raw === "string" && url.raw.trim()) return url.raw.trim();

  const host = url.host;
  const path = url.path;
  const protocol = url.protocol ?? "https";
  const hostPart = Array.isArray(host) ? host.join(".") : String(host ?? "");
  const pathPart = Array.isArray(path) ? `/${path.join("/")}` : path ? `/${path}` : "";
  if (!hostPart) return "";
  return `${protocol}://${hostPart}${pathPart}`.replace(/\/+/g, "/").replace(":/", "://");
}

export function splitUrlParams(url) {
  try {
    const parsed = new URL(url);
    const params = [...parsed.searchParams.entries()].map(([key, value]) => ({
      key,
      value,
      enabled: true,
    }));
    parsed.search = "";
    return { baseUrl: parsed.toString(), params };
  } catch {
    return { baseUrl: url, params: [] };
  }
}

export function normalizeImportUrl(url) {
  if (!url) return "";
  let normalized = String(url).trim();
  normalized = normalized.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, "[[$1]]");
  normalized = normalized.replace(/\{\{\s*([a-zA-Z0-9_ ]+)\s*\}\}/g, (_, key) => `[[${key.trim().toUpperCase()}]]`);
  return normalized;
}

export function parsePostmanAuth(auth) {
  if (!auth || typeof auth !== "object") return { type: "none" };
  const type = auth.type;
  if (!type || type === "noauth") return { type: "none" };

  const entries = Array.isArray(auth[type]) ? auth[type] : [];
  const get = (key) => String(entries.find((e) => e?.key === key)?.value ?? "");

  if (type === "bearer") return { type: "bearer", token: get("token") };
  if (type === "basic") return { type: "basic", username: get("username"), password: get("password") };
  if (type === "apikey") {
    return {
      type: "api-key",
      key: get("key"),
      value: get("value"),
      in: get("in") === "query" ? "query" : "header",
    };
  }
  return { type: "none" };
}

export function parsePostmanBody(body) {
  if (!body || typeof body !== "object") {
    return { type: "none", content: "" };
  }

  const mode = String(body.mode ?? "raw");
  if (mode === "urlencoded") {
    const rows = parseKeyValueList(body.urlencoded);
    const content = rows.map((r) => `${encodeURIComponent(r.key)}=${encodeURIComponent(r.value)}`).join("&");
    return { type: "text", content };
  }

  if (mode === "formdata") {
    return { type: "form", content: "", formRows: parseKeyValueList(body.formdata) };
  }

  const raw = String(body.raw ?? "");
  const language = body.options?.raw?.language ?? "";
  const isJson = language === "json" || raw.trim().startsWith("{") || raw.trim().startsWith("[");
  return raw ? { type: isJson ? "json" : "text", content: raw } : { type: "none", content: "" };
}

export function emptyImportCollection(name) {
  return {
    name: name || "Imported Collection",
    description: "",
    folders: [],
    requests: [],
  };
}

export function countImportRequests(collection) {
  const countFolder = (folders) =>
    (folders || []).reduce(
      (sum, folder) => sum + (folder.requests?.length || 0) + countFolder(folder.folders),
      0,
    );
  return (collection.requests?.length || 0) + countFolder(collection.folders);
}

export function flattenImportPreview(collection) {
  const rows = [];

  const walkFolder = (folder, prefix = "") => {
    const label = prefix ? `${prefix} / ${folder.name}` : folder.name;
    for (const request of folder.requests || []) {
      rows.push({ ...request, folderLabel: label });
    }
    for (const child of folder.folders || []) {
      walkFolder(child, label);
    }
  };

  for (const request of collection.requests || []) {
    rows.push({ ...request, folderLabel: null });
  }
  for (const folder of collection.folders || []) {
    walkFolder(folder);
  }

  return rows;
}
