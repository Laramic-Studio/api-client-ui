// Collections explorer for the API Builder:
// - nested folders within collections
// - HTML5 drag-and-drop to reorder requests and move into folders
// - context menu actions for add/rename/delete
import { useMemo, useState } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections } from "@/lib/store/selectors";
import { COLL } from "@/constants/testIds";
import { toast } from "sonner";
import { getErrorMessage } from "@/hooks/use-auth";
import {
  useCollections,
  useCreateCollection,
  useCreateFolder,
  useDeleteCollection,
  useDuplicateCollection,
  useUpdateFolder,
  useDeleteFolder,
} from "@/hooks/use-collections";
import {
  applyOptimisticRequestPatch,
  computeReorderedRequestIds,
  useCreateRequest,
  useDeleteRequest,
  useMoveRequest,
  useReorderRequests,
  useUpdateRequest,
} from "@/hooks/use-requests";
import { CollectionRow } from "@/components/builder/CollectionsExplorerRows";

export default function CollectionsExplorer({ activeRequestId, onOpenRequest }) {
  const collections = useAppStore(selectWorkspaceCollections);
  const moveRequestLocal = useAppStore((s) => s.moveRequest);
  const reorderRequestLocal = useAppStore((s) => s.reorderRequest);
  const closeTab = useAppStore((s) => s.closeTab);
  const { isLoading } = useCollections();

  const createCollectionMut = useCreateCollection();
  const deleteCollectionMut = useDeleteCollection();
  const duplicateCollectionMut = useDuplicateCollection();
  const createFolderMut = useCreateFolder();
  const updateFolderMut = useUpdateFolder();
  const deleteFolderMut = useDeleteFolder();
  const createRequestMut = useCreateRequest();
  const patchRequestMut = useUpdateRequest();
  const deleteRequestMut = useDeleteRequest();
  const moveRequestMut = useMoveRequest();
  const reorderRequestsMut = useReorderRequests();

  const [filter, setFilter] = useState("");
  const [openCols, setOpenCols] = useState(() => Object.fromEntries(collections.map((c) => [c.id, true])));
  const [openFolders, setOpenFolders] = useState({});
  const [dragOver, setDragOver] = useState(null);
  const [pending, setPending] = useState(null);

  const filtered = useMemo(() => {
    if (!filter) return collections;
    const q = filter.toLowerCase();
    return collections
      .map((c) => ({
        ...c,
        requests: c.requests.filter((r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q)),
      }))
      .filter((c) => c.requests.length > 0 || c.name.toLowerCase().includes(q));
  }, [collections, filter]);

  const run = (key, fn) => {
    setPending(key);
    fn({
      onSettled: () => setPending(null),
      onError: (err) => toast.error(getErrorMessage(err, "Action failed.")),
    });
  };

  const actions = {
    addFolder: (collectionId, payload) => {
      run(`folder:${collectionId}`, (opts) => createFolderMut.mutate({ collectionId, payload }, opts));
    },
    renameFolder: (collectionId, folderId, name) => {
      run(`rename-folder:${folderId}`, (opts) =>
        updateFolderMut.mutate({ collectionId, folderId, patch: { name } }, opts),
      );
    },
    deleteFolder: (collectionId, folderId) => {
      run(`delete-folder:${folderId}`, (opts) =>
        deleteFolderMut.mutate({ collectionId, folderId }, {
          ...opts,
          onSuccess: () => toast.success("Folder deleted"),
        }),
      );
    },
    addRequest: (collectionId, payload, onCreated) => {
      run(`request:${collectionId}`, (opts) =>
        createRequestMut.mutate({ collectionId, payload }, {
          ...opts,
          onSuccess: (data) => {
            onCreated?.(data.request.id, collectionId);
          },
        }),
      );
    },
    deleteRequest: (collectionId, requestId) => {
      run(`delete-request:${requestId}`, (opts) =>
        deleteRequestMut.mutate({ collectionId, requestId }, {
          ...opts,
          onSuccess: () => {
            closeTab(requestId);
            toast.success("Request deleted");
          },
        }),
      );
    },
    moveRequest: (collectionId, requestId, opts) => {
      moveRequestLocal(collectionId, requestId, opts);
      moveRequestMut.mutate(
        { collectionId, requestId, folderId: opts.folderId },
        { onError: (err) => toast.error(getErrorMessage(err, "Could not move request.")) },
      );
    },
    reorderRequest: (collectionId, fromId, toId) => {
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) return;
      const moved = collection.requests.find((r) => r.id === fromId);
      const { requestIds, folderId } = computeReorderedRequestIds(collection, fromId, toId);
      reorderRequestLocal(collectionId, fromId, toId);
      reorderRequestsMut.mutate(
        { collectionId, requestIds },
        { onError: (err) => toast.error(getErrorMessage(err, "Could not reorder requests.")) },
      );
      if (moved && moved.folderId !== folderId) {
        moveRequestMut.mutate({ collectionId, requestId: fromId, folderId });
      }
    },
    patchRequest: (collectionId, requestId, patch) => {
      applyOptimisticRequestPatch(collectionId, requestId, patch);
      patchRequestMut.mutate({ collectionId, requestId, patch });
    },
    deleteCollection: (id) => {
      run(`delete-collection:${id}`, (opts) =>
        deleteCollectionMut.mutate(id, { ...opts, onSuccess: () => toast.success("Collection deleted") }),
      );
    },
    duplicateCollection: (id) => {
      run(`duplicate-collection:${id}`, (opts) =>
        duplicateCollectionMut.mutate(id, {
          ...opts,
          onSuccess: (data) => toast.success(`Duplicated as ${data.collection.name}`),
        }),
      );
    },
  };

  if (isLoading && collections.length === 0) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-[12px] border-r border-[hsl(var(--border))]">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading collections…
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-r border-[hsl(var(--border))]">
      <div className="h-12 shrink-0 flex items-center px-3 border-b border-[hsl(var(--border))]">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Collections</div>
        <button
          className="ml-auto h-7 w-7 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground disabled:opacity-50"
          disabled={createCollectionMut.isPending}
          onClick={() => {
            createCollectionMut.mutate(
              { name: "New Collection" },
              {
                onSuccess: (data) => {
                  setOpenCols((o) => ({ ...o, [data.collection.id]: true }));
                  toast.success(`Created ${data.collection.name}`);
                },
                onError: (err) => toast.error(getErrorMessage(err, "Could not create collection.")),
              },
            );
          }}
          data-testid={COLL.newCollection}
          title="New collection"
        >
          {createCollectionMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="p-2 border-b border-[hsl(var(--border))]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter requests…"
            className="w-full h-8 pl-8 pr-2 rounded-md bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[12px] placeholder:text-muted-foreground ring-focus"
            data-testid="explorer-search"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">No collections match</div>
        )}
        {filtered.map((c) => (
          <CollectionRow
            key={c.id}
            collection={c}
            isOpen={openCols[c.id] ?? true}
            onToggle={() => setOpenCols((o) => ({ ...o, [c.id]: !(o[c.id] ?? true) }))}
            activeRequestId={activeRequestId}
            onOpenRequest={onOpenRequest}
            openFolders={openFolders}
            setOpenFolders={setOpenFolders}
            actions={actions}
            dragOver={dragOver}
            setDragOver={setDragOver}
            pending={pending}
          />
        ))}
      </div>
    </div>
  );
}
