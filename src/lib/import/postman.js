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

function mapPostmanRequest(item) {
  const request = item.request;
  if (!request) return null;

  const urlString = postmanUrlToString(request.url);
  const { baseUrl, params: urlParams } = splitUrlParams(urlString);
  const queryParams = parseKeyValueList(
    request.url && typeof request.url === "object" ? request.url.query : [],
  );
  const params = queryParams.length ? queryParams : urlParams;

  return {
    name: item.name?.trim() || "Untitled request",
    method: parseHttpMethod(request.method),
    url: normalizeImportUrl(baseUrl),
    params,
    headers: parseKeyValueList(request.header),
    auth: parsePostmanAuth(request.auth),
    body: parsePostmanBody(request.body),
    docs: typeof item.description === "string" ? item.description : "",
  };
}

function parsePostmanItems(items) {
  const folders = [];
  const requests = [];

  for (const item of items || []) {
    if (item.request) {
      const parsed = mapPostmanRequest(item);
      if (parsed) requests.push(parsed);
      continue;
    }
    if (item.item?.length) {
      const nested = parsePostmanItems(item.item);
      folders.push({
        name: item.name?.trim() || "Folder",
        description: typeof item.description === "string" ? item.description : "",
        folders: nested.folders,
        requests: nested.requests,
      });
    }
  }

  return { folders, requests };
}

export function importPostmanCollection(data) {
  const info = data.info || {};
  const name = info.name?.trim() || "Imported Collection";
  const { folders, requests } = parsePostmanItems(data.item);

  return {
    ...emptyImportCollection(name),
    name,
    description: typeof info.description === "string" ? info.description : "",
    folders,
    requests,
  };
}
