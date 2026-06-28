import {
  emptyImportCollection,
  normalizeImportUrl,
  parseHttpMethod,
} from "@/lib/import/shared";

/** Hoppscotch uses <<VAR>> — map to Noidr [[VAR]]. */
export function normalizeHoppscotchVar(value) {
  if (typeof value !== "string") return value;
  return value.replace(/<<([^>]+)>>/g, "[[$1]]");
}

function mapHoppscotchHeaders(headers) {
  return (headers || [])
    .filter((row) => row?.active !== false && row?.key)
    .map((row) => ({
      key: String(row.key),
      value: normalizeHoppscotchVar(String(row.value ?? "")),
      enabled: row.active !== false,
    }));
}

function mapHoppscotchParams(params) {
  return (params || [])
    .filter((row) => row?.active !== false && row?.key)
    .map((row) => ({
      key: String(row.key),
      value: normalizeHoppscotchVar(String(row.value ?? "")),
      enabled: row.active !== false,
    }));
}

function mapHoppscotchAuth(auth) {
  if (!auth || typeof auth !== "object") return { type: "none" };

  const authType = auth.authType || auth.type;
  if (!authType || authType === "none" || authType === "inherit") {
    return { type: "none" };
  }
  if (authType === "bearer") {
    return { type: "bearer", token: normalizeHoppscotchVar(auth.token || "") };
  }
  if (authType === "basic") {
    return {
      type: "basic",
      username: auth.username || "",
      password: auth.password || "",
    };
  }
  if (authType === "api-key") {
    return {
      type: "api-key",
      key: auth.key || "",
      value: auth.value || "",
      in: auth.addTo === "query" ? "query" : "header",
    };
  }
  return { type: "none" };
}

function mapHoppscotchBody(body) {
  if (!body || typeof body !== "object") return { type: "none", content: "" };

  const contentType = body.contentType || "";
  const rawBody = body.body;

  if (contentType === "multipart/form-data" && Array.isArray(rawBody)) {
    return {
      type: "form",
      content: "",
      formRows: rawBody
        .filter((row) => row?.key)
        .map((row) => ({
          key: String(row.key),
          value: normalizeHoppscotchVar(String(row.value ?? "")),
          enabled: row.isFile !== true,
        })),
    };
  }

  if (contentType === "application/x-www-form-urlencoded" && typeof rawBody === "string") {
    return { type: "text", content: rawBody };
  }

  if (
    contentType.includes("json")
    || (typeof rawBody === "string" && (rawBody.trim().startsWith("{") || rawBody.trim().startsWith("[")))
  ) {
    return {
      type: "json",
      content: typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody, null, 2),
    };
  }

  if (rawBody != null && rawBody !== "") {
    return { type: "text", content: String(rawBody) };
  }

  return { type: "none", content: "" };
}

function buildRequestIndex(requests) {
  const index = new Map();

  for (const request of requests || []) {
    if (!request || typeof request !== "object") continue;
    const keys = [request.id, request._ref_id, request.v].filter((k) => k != null);
    for (const key of keys) index.set(String(key), request);
  }

  return index;
}

function resolveFolderRequests(folderRequests, requestIndex) {
  const resolved = [];

  for (const entry of folderRequests || []) {
    if (typeof entry === "string" || typeof entry === "number") {
      const request = requestIndex.get(String(entry));
      if (request) resolved.push(request);
      continue;
    }
    if (entry && typeof entry === "object" && (entry.endpoint || entry.method)) {
      resolved.push(entry);
    }
  }

  return resolved;
}

function mapHoppscotchRequest(request) {
  if (!request || typeof request !== "object") return null;
  if (!request.endpoint && !request.method) return null;

  const headers = mapHoppscotchHeaders(request.headers);
  const params = mapHoppscotchParams(request.params);

  return {
    name: request.name?.trim() || "Untitled request",
    method: parseHttpMethod(request.method),
    url: normalizeImportUrl(normalizeHoppscotchVar(request.endpoint || "")),
    params,
    headers: headers.length ? headers : [{ key: "Accept", value: "application/json", enabled: true }],
    auth: mapHoppscotchAuth(request.auth),
    body: mapHoppscotchBody(request.body),
    docs: typeof request.description === "string" ? request.description : "",
    tests: request.testScript || "",
    preScript: request.preRequestScript || "",
  };
}

function parseHoppscotchFolder(folder, requestIndex) {
  const folderRequests = resolveFolderRequests(folder.requests, requestIndex)
    .map(mapHoppscotchRequest)
    .filter(Boolean);

  return {
    name: folder.name?.trim() || "Folder",
    description: typeof folder.description === "string" ? folder.description : "",
    folders: (folder.folders || []).map((child) => parseHoppscotchFolder(child, requestIndex)),
    requests: folderRequests,
  };
}

export function unwrapHoppscotchExport(data) {
  if (!data) return null;

  if (Array.isArray(data)) {
    return data.find((entry) => entry?.name && (entry.folders || entry.requests)) || null;
  }

  if (data.postwoman?.collections?.length) {
    return data.postwoman.collections[0];
  }

  if (data.name && (Array.isArray(data.folders) || Array.isArray(data.requests))) {
    return data;
  }

  return null;
}

export function isHoppscotchCollection(data) {
  const collection = unwrapHoppscotchExport(data);
  if (!collection) return false;
  if (collection.info && collection.item) return false;
  if (collection.openapi || collection.swagger) return false;
  if (collection._type === "export") return false;
  if (collection.log?.entries) return false;

  const requests = collection.requests || [];
  const hasEndpoint = requests.some((r) => r && typeof r === "object" && "endpoint" in r);
  const hasVersion = typeof collection.v === "number" || requests.some((r) => r?.v != null);

  return Boolean(
    collection.name
    && Array.isArray(collection.folders)
    && Array.isArray(requests)
    && (hasEndpoint || hasVersion),
  );
}

export function importHoppscotchCollection(data) {
  const source = unwrapHoppscotchExport(data);
  if (!source) return null;

  const requestIndex = buildRequestIndex(source.requests);
  const folders = (source.folders || []).map((folder) => parseHoppscotchFolder(folder, requestIndex));
  const rootRequests = (source.requests || [])
    .filter((request) => request && typeof request === "object" && request.endpoint)
    .map(mapHoppscotchRequest)
    .filter(Boolean);

  return {
    ...emptyImportCollection(source.name),
    name: source.name?.trim() || "Imported Hoppscotch",
    description: typeof source.description === "string" ? source.description : "",
    folders,
    requests: rootRequests,
  };
}
