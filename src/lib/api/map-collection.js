import { mapApiRequest } from "@/lib/api/map-request";

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
  if (patch.parent_folder_id !== undefined) payload.parent_folder_id = patch.parent_folder_id;

  return payload;
}

export function mapCreateFolderPayload(payload = {}) {
  return {
    name: payload.name || "New folder",
    parent_folder_id: payload.parentId ?? payload.parent_folder_id ?? null,
  };
}
