function mapApiRequest(request) {
  const bodyType = request.bodyType || request.body_type || "none";

  return {
    id: request.id,
    name: request.name,
    method: request.method,
    url: request.url || "[[BASE_URL]]/",
    params: request.params || [],
    headers: request.headers || [],
    auth: request.auth?.type ? request.auth : { type: "none" },
    body: { type: bodyType, content: request.body ?? "" },
    tests: "",
    preScript: "",
    starred: false,
    docs: request.description || "",
    examples: request.examples || [],
    folderId: request.folderId ?? request.folder_id ?? null,
    order: request.order ?? request.sortOrder ?? request.sort_order ?? 0,
  };
}

export function mapApiCollection(collection, workspaceId) {
  return {
    id: collection.id,
    workspaceId: String(workspaceId),
    name: collection.name,
    description: collection.description || "",
    archived: Boolean(collection.archived),
    pinned: Boolean(collection.pinned),
    folders: (collection.folders || []).map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId ?? folder.parent_folder_id ?? null,
      expanded: folder.expanded !== false,
    })),
    requests: (collection.requests || []).map(mapApiRequest),
    createdAt: Date.now(),
  };
}

export function mapCollectionToApi(patch) {
  const payload = {};

  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.archived !== undefined) payload.archived = patch.archived;
  if (patch.pinned !== undefined) payload.pinned = patch.pinned;

  return payload;
}

export function mapFolderToApi(patch) {
  const payload = {};

  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.parentId !== undefined) payload.parent_folder_id = patch.parentId;

  return payload;
}
