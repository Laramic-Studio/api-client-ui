import * as collectionsApi from "@/lib/api/collections-api";
import { mapRequestToApi } from "@/lib/api/map-request";
import { refreshCollectionsInStore } from "@/hooks/use-collections";

function mapImportRequestToApi(request, folderId = null) {
  const payload = mapRequestToApi({
    name: request.name || "Untitled request",
    method: request.method || "GET",
    url: request.url || "",
    params: request.params || [],
    headers: request.headers?.length ? request.headers : [{ key: "Accept", value: "application/json", enabled: true }],
    auth: request.auth || { type: "none" },
    body: request.body || { type: "none", content: "" },
    docs: request.docs || "",
    folderId,
  });

  if (folderId) payload.folder_id = folderId;
  return payload;
}

async function createImportRequest(teamId, collectionId, request, folderId = null) {
  const data = await collectionsApi.createCollectionRequest(
    teamId,
    collectionId,
    mapImportRequestToApi(request, folderId),
  );
  return data.request;
}

async function persistFolderTree(teamId, collectionId, folders, parentFolderId = null) {
  let createdCount = 0;

  for (const folder of folders || []) {
    const folderData = await collectionsApi.createFolder(teamId, collectionId, {
      name: folder.name || "Folder",
      parent_folder_id: parentFolderId,
    });
    const folderId = folderData.folder?.id;
    if (!folderId) continue;

    for (const request of folder.requests || []) {
      await createImportRequest(teamId, collectionId, request, folderId);
      createdCount += 1;
    }

    createdCount += await persistFolderTree(teamId, collectionId, folder.folders, folderId);
  }

  return createdCount;
}

export async function persistImportCollection(teamId, collection) {
  if (!teamId) throw new Error("Select a workspace before importing.");
  if (!collection?.name) throw new Error("Import collection is missing a name.");

  const collectionData = await collectionsApi.createCollection(teamId, {
    name: collection.name,
    description: collection.description || "",
  });

  const collectionId = collectionData.collection?.id;
  if (!collectionId) throw new Error("Could not create collection.");

  let createdCount = 0;

  for (const request of collection.requests || []) {
    await createImportRequest(teamId, collectionId, request);
    createdCount += 1;
  }

  createdCount += await persistFolderTree(teamId, collectionId, collection.folders);

  await refreshCollectionsInStore(teamId);

  return {
    collectionId,
    collectionName: collectionData.collection?.name || collection.name,
    requestCount: createdCount,
  };
}
