import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections } from "@/lib/store/selectors";
import { useBindAiTool } from "@/providers/AiContextProvider";
import { summarizeRequestForAi } from "@/lib/ai/snapshot";
import { useNavigate } from "react-router-dom";
import MethodBadge from "@/components/shared/MethodBadge";
import {
  Plus, Search, Star, Archive, Copy, Trash2, Folder, ChevronRight, ChevronDown, Loader2,
} from "lucide-react";
import { COLL } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/hooks/use-auth";
import {
  useCollections,
  useCreateCollection,
  useCreateCollectionRequest,
  useDebouncedCollectionUpdate,
  useDeleteCollection,
  useDuplicateCollection,
  useUpdateCollection,
} from "@/hooks/use-collections";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator,
} from "@/components/ui/context-menu";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ReadOnlyWorkspaceBanner from "@/components/shared/ReadOnlyWorkspaceBanner";
import { useWorkspaceWriteAccess } from "@/hooks/use-team-permissions";

export default function Collections() {
  const collections = useAppStore(selectWorkspaceCollections);
  const updateLocal = useAppStore((s) => s.updateCollection);
  const { isLoading } = useCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const savePatch = useDebouncedCollectionUpdate(700);
  const deleteCollection = useDeleteCollection();
  const duplicateCollection = useDuplicateCollection();
  const createRequest = useCreateCollectionRequest();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState({});
  const [pendingAction, setPendingAction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { isReadOnly, notifyReadOnly } = useWorkspaceWriteAccess();

  const filtered = collections
    .filter((c) => (showArchived ? c.archived : !c.archived))
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  useBindAiTool("collections", {
    getSnapshot: () => ({
      collectionCount: filtered.length,
      collections: filtered.map((c) => ({
        id: c.id,
        name: c.name,
        archived: Boolean(c.archived),
        requestCount: (c.requests || []).length,
        requests: (c.requests || []).map((r) => summarizeRequestForAi(r)),
      })),
    }),
  });

  const patchCollection = (id, patch) => {
    if (isReadOnly) {
      notifyReadOnly();
      return;
    }
    updateLocal(id, patch);
    savePatch(id, patch);
  };

  const handleCreate = () => {
    if (isReadOnly) {
      notifyReadOnly();
      return;
    }
    createCollection.mutate(
      { name: "New Collection" },
      {
        onSuccess: (data) => toast.success(`Created ${data.collection.name}`),
        onError: (err) => toast.error(getErrorMessage(err, "Could not create collection.")),
      },
    );
  };

  const handleToggle = (collection, field) => {
    if (isReadOnly) {
      notifyReadOnly();
      return;
    }
    const next = !collection[field];
    const key = `${collection.id}:${field}`;
    setPendingAction(key);
    updateLocal(collection.id, { [field]: next });
    updateCollection.mutate(
      { id: collection.id, patch: { [field]: next } },
      {
        onSettled: () => setPendingAction(null),
        onError: (err) => {
          updateLocal(collection.id, { [field]: collection[field] });
          toast.error(getErrorMessage(err, "Could not update collection."));
        },
      },
    );
  };

  const handleDuplicate = (id) => {
    if (isReadOnly) {
      notifyReadOnly();
      return;
    }
    setPendingAction(`${id}:duplicate`);
    duplicateCollection.mutate(id, {
      onSuccess: (data) => toast.success(`Duplicated as ${data.collection.name}`),
      onError: (err) => toast.error(getErrorMessage(err, "Could not duplicate collection.")),
      onSettled: () => setPendingAction(null),
    });
  };

  const handleDelete = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setPendingAction(`${id}:delete`);
    deleteCollection.mutate(id, {
      onSuccess: () => {
        toast.success("Collection deleted");
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(getErrorMessage(err, "Could not delete collection.")),
      onSettled: () => setPendingAction(null),
    });
  };

  const handleAddRequest = (collectionId) => {
    if (isReadOnly) {
      notifyReadOnly();
      return;
    }
    setPendingAction(`${collectionId}:request`);
    createRequest.mutate(
      { collectionId, payload: { name: "New request" } },
      {
        onSuccess: (data) => navigate(`/builder/${data.request.id}`),
        onError: (err) => toast.error(getErrorMessage(err, "Could not create request.")),
        onSettled: () => setPendingAction(null),
      },
    );
  };

  if (isLoading && collections.length === 0) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-[13px]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading collections…
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <ReadOnlyWorkspaceBanner className="mb-5" />
      <div className="flex items-end justify-between gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// library</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Collections</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Organize your API requests by service, feature, or team.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search collections…"
              className="h-9 w-64 pl-8 pr-2 rounded-md bg-muted border border-border text-[13px] placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={cn("h-9 px-3 rounded-md text-[12.5px] border", showArchived ? "border-[hsl(var(--brand))] text-foreground bg-[hsl(var(--brand))]/15" : "border-border text-foreground/85 hover:bg-accent/50")}
          >
            {showArchived ? "Showing archived" : "Show archived"}
          </button>
          <button
            onClick={handleCreate}
            disabled={createCollection.isPending || isReadOnly}
            data-testid={COLL.newCollection}
            className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-50"
          >
            {createCollection.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {createCollection.isPending ? "Creating…" : "New collection"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((c) => {
          const isOpen = open[c.id];
          const isDuplicating = pendingAction === `${c.id}:duplicate`;
          const isDeleting = pendingAction === `${c.id}:delete`;
          const isAddingRequest = pendingAction === `${c.id}:request`;
          const isTogglingPin = pendingAction === `${c.id}:pinned`;
          const isTogglingArchive = pendingAction === `${c.id}:archived`;

          return (
            <ContextMenu key={c.id}>
              <ContextMenuTrigger asChild>
                <div
                  className="rounded-md border border-border bg-card hover:border-white/20 transition-colors"
                  data-testid={COLL.item(c.id)}
                >
                  <div className="p-4 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-accent/50 grid place-items-center text-[hsl(var(--brand))]">
                      <Folder className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          value={c.name}
                          onChange={(e) => patchCollection(c.id, { name: e.target.value })}
                          className="bg-transparent text-[14px] font-medium outline-none flex-1 min-w-0"
                        />
                        {c.pinned && <Star className="h-3.5 w-3.5 text-[hsl(var(--warning))] fill-[hsl(var(--warning))]" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wider">
                        {c.requests.length} requests
                      </div>
                    </div>
                    <button
                      onClick={() => setOpen((o) => ({ ...o, [c.id]: !isOpen }))}
                      className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground"
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                  {isOpen && (
                    <div className="border-t border-border max-h-48 overflow-auto">
                      {c.requests.slice(0, 8).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => navigate(`/builder/${r.id}`)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-[12px] hover:bg-accent/50"
                          data-testid={COLL.request(r.id)}
                        >
                          <MethodBadge method={r.method} className="w-12 text-left" />
                          <span className="truncate">{r.name}</span>
                          <span className="ml-auto text-muted-foreground font-mono text-[11px] truncate max-w-[180px]">{r.url}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => handleAddRequest(c.id)}
                        disabled={isAddingRequest}
                        className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-muted-foreground hover:bg-accent/50 disabled:opacity-50"
                      >
                        {isAddingRequest ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        {isAddingRequest ? "Creating…" : "Add request"}
                      </button>
                    </div>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-card border-border text-foreground">
                <ContextMenuItem
                  disabled={isTogglingPin}
                  onClick={() => handleToggle(c, "pinned")}
                >
                  {isTogglingPin ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Star className="h-3.5 w-3.5" />
                  )}
                  {c.pinned ? "Unpin" : "Pin"}
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={isDuplicating}
                  onClick={() => handleDuplicate(c.id)}
                >
                  {isDuplicating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {isDuplicating ? "Duplicating…" : "Duplicate"}
                </ContextMenuItem>
                <ContextMenuItem
                  disabled={isTogglingArchive}
                  onClick={() => handleToggle(c, "archived")}
                >
                  {isTogglingArchive ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Archive className="h-3.5 w-3.5" />
                  )}
                  {c.archived ? "Restore" : "Archive"}
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-accent" />
                <ContextMenuItem
                  disabled={isDeleting}
                  onClick={() => handleDelete(c.id, c.name)}
                  className="text-red-400"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {isDeleting ? "Deleting…" : "Delete"}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-md border border-dashed border-border p-10 text-center bg-card">
            <div className="text-[13px] text-foreground/85">No collections found</div>
            <div className="text-[12px] text-muted-foreground mt-1">Create your first collection to organize requests.</div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete collection"
        description={deleteTarget ? `Permanently delete "${deleteTarget.name}" and all its requests?` : ""}
        onConfirm={confirmDelete}
        loading={pendingAction === `${deleteTarget?.id}:delete`}
      />
    </div>
  );
}
