export function normalizeRequestUrl(url) {
  if (!url || url === "[[BASE_URL]]/") return "";
  return url;
}

export function buildRequestBreadcrumb({ request, collection, isScratch, example = null }) {
  if (isScratch) {
    return [{ label: "Untitled request" }];
  }

  if (!request) {
    return [{ label: "Request" }];
  }

  if (!collection) {
    return [{ label: request.name || "Untitled request" }];
  }

  const parts = [{ label: collection.name }];

  if (request.folderId && Array.isArray(collection.folders)) {
    const chain = [];
    let current = collection.folders.find((folder) => folder.id === request.folderId);
    while (current) {
      chain.unshift(current);
      current = collection.folders.find((folder) => folder.id === current.parentId);
    }
    chain.forEach((folder) => parts.push({ label: folder.name }));
  }

  parts.push({ label: request.name || "Untitled request" });

  if (example?.name) {
    parts.push({ label: example.name, kind: "example" });
  }

  return parts;
}
