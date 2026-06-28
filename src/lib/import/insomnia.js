import {
  emptyImportCollection,
  normalizeImportUrl,
  parseHttpMethod,
  parseKeyValueList,
  parsePostmanAuth,
  parsePostmanBody,
  postmanUrlToString,
  splitUrlParams,
} from "@/lib/import/shared";

function mapInsomniaRequest(resource) {
  const urlString = postmanUrlToString(resource.url);
  const { baseUrl, params } = splitUrlParams(urlString);
  const body = resource.body && typeof resource.body === "object"
    ? parsePostmanBody({
        mode: resource.body.mimeType?.includes("json") ? "raw" : "raw",
        raw: resource.body.text ?? "",
      })
    : { type: "none", content: "" };

  return {
    name: resource.name?.trim() || "Untitled request",
    method: parseHttpMethod(resource.method),
    url: normalizeImportUrl(baseUrl),
    params,
    headers: parseKeyValueList(resource.headers),
    auth: parsePostmanAuth(resource.authentication),
    body,
    docs: typeof resource.description === "string" ? resource.description : "",
  };
}

function buildInsomniaTree(resources, parentId) {
  const folders = [];
  const requests = [];

  const children = resources
    .filter((r) => (r.parentId ?? null) === parentId)
    .sort((a, b) => (a.metaSortKey ?? 0) - (b.metaSortKey ?? 0));

  for (const resource of children) {
    if (resource._type === "request_group") {
      const nested = buildInsomniaTree(resources, resource._id);
      folders.push({
        name: resource.name?.trim() || "Folder",
        description: typeof resource.description === "string" ? resource.description : "",
        folders: nested.folders,
        requests: nested.requests,
      });
      continue;
    }
    if (resource._type === "request") {
      requests.push(mapInsomniaRequest(resource));
    }
  }

  return { folders, requests };
}

export function importInsomniaExport(data) {
  const resources = Array.isArray(data.resources) ? data.resources : [];
  const workspace = resources.find((r) => r._type === "Workspace");
  const name = workspace?.name?.trim() || "Imported Insomnia";
  const rootId = workspace?._id ?? null;
  const { folders, requests } = buildInsomniaTree(resources, rootId);

  return {
    ...emptyImportCollection(name),
    name,
    description: typeof workspace?.description === "string" ? workspace.description : "",
    folders,
    requests,
  };
}
