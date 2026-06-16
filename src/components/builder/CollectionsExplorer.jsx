// Collections explorer for the API Builder:
// - nested folders within collections
// - HTML5 drag-and-drop to reorder requests and move into folders
// - context menu actions for add/rename/delete
import { useMemo, useState } from "react";
import {
  ChevronDown, ChevronRight, Folder, FolderPlus, FilePlus, Plus, Search, Trash2, Edit3, Copy, FolderOpen,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections } from "@/lib/store/selectors";
import MethodBadge from "@/components/shared/MethodBadge";
import { COLL } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator,
} from "@/components/ui/context-menu";

export default function CollectionsExplorer({ activeRequestId, onOpenRequest }) {
  const collections = useAppStore(selectWorkspaceCollections);
  const createCollection = useAppStore((s) => s.createCollection);
  const updateCollection = useAppStore((s) => s.updateCollection);
  const deleteCollection = useAppStore((s) => s.deleteCollection);
  const duplicateCollection = useAppStore((s) => s.duplicateCollection);
  const addRequest = useAppStore((s) => s.addRequest);
  const deleteRequest = useAppStore((s) => s.deleteRequest);
  const moveRequest = useAppStore((s) => s.moveRequest);
  const reorderRequest = useAppStore((s) => s.reorderRequest);
  const addFolder = useAppStore((s) => s.addFolder);
  const renameFolder = useAppStore((s) => s.renameFolder);
  const deleteFolder = useAppStore((s) => s.deleteFolder);
  const updateRequest = useAppStore((s) => s.updateRequest);

  const [filter, setFilter] = useState("");
  const [openCols, setOpenCols] = useState(() => Object.fromEntries(collections.map((c) => [c.id, true])));
  const [openFolders, setOpenFolders] = useState({});
  const [dragOver, setDragOver] = useState(null);

  const filtered = useMemo(() => {
    if (!filter) return collections;
    const q = filter.toLowerCase();
    return collections.map((c) => ({
      ...c,
      requests: c.requests.filter((r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q)),
    })).filter((c) => c.requests.length > 0 || c.name.toLowerCase().includes(q));
  }, [collections, filter]);

  return (
    <div className="h-full flex flex-col border-r border-[hsl(var(--border))]">
      <div className="h-12 shrink-0 flex items-center px-3 border-b border-[hsl(var(--border))]">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Collections</div>
        <button
          className="ml-auto h-7 w-7 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          onClick={() => { const c = createCollection("New Collection"); setOpenCols((o) => ({ ...o, [c.id]: true })); toast.success(`Created ${c.name}`); }}
          data-testid={COLL.newCollection}
          title="New collection"
        >
          <Plus className="h-3.5 w-3.5" />
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
            actions={{
              addFolder, renameFolder, deleteFolder,
              addRequest, deleteRequest, moveRequest, reorderRequest, updateRequest,
              updateCollection, deleteCollection, duplicateCollection,
            }}
            dragOver={dragOver}
            setDragOver={setDragOver}
          />
        ))}
      </div>
    </div>
  );
}

function CollectionRow({ collection, isOpen, onToggle, activeRequestId, onOpenRequest, openFolders, setOpenFolders, actions, dragOver, setDragOver }) {
  const c = collection;
  const folders = c.folders || [];
  const folderlessRequests = c.requests.filter((r) => !r.folderId);

  // DnD into root (no folder) of this collection
  const onDropToRoot = (e) => {
    e.preventDefault(); e.stopPropagation();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (payload.collectionId === c.id) actions.moveRequest(c.id, payload.requestId, { folderId: null });
    setDragOver(null);
  };

  return (
    <div className="select-none mb-1">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(`col-${c.id}`); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={onDropToRoot}
            className={cn(
              "w-full flex items-center gap-1.5 h-7 px-2 rounded text-[12.5px] hover:bg-accent/50 text-foreground/85",
              dragOver === `col-${c.id}` && "bg-[hsl(var(--brand))]/10 ring-1 ring-inset ring-[hsl(var(--brand))]/40"
            )}
          >
            <button onClick={onToggle} className="h-5 w-5 grid place-items-center text-muted-foreground" data-testid={COLL.item(c.id)}>
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            <Folder className="h-3.5 w-3.5 text-[hsl(var(--brand))]" />
            <span className="truncate font-medium">{c.name}</span>
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">{c.requests.length}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
          <ContextMenuItem onClick={() => actions.addFolder(c.id, { name: "New folder" })}>
            <FolderPlus className="h-3.5 w-3.5" /> New folder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => { const r = actions.addRequest(c.id, { name: "New request" }); onOpenRequest(r.id, c.id); }}>
            <FilePlus className="h-3.5 w-3.5" /> New request
          </ContextMenuItem>
          <ContextMenuItem onClick={() => actions.duplicateCollection(c.id)}>
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-[hsl(var(--border))]" />
          <ContextMenuItem onClick={() => { actions.deleteCollection(c.id); toast.success("Collection deleted"); }} className="text-red-400">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isOpen && (
        <div className="ml-3 border-l border-[hsl(var(--border))] pl-1.5">
          {folders.filter((f) => !f.parentId).map((f) => (
            <FolderRow
              key={f.id}
              folder={f}
              collection={c}
              allFolders={folders}
              openFolders={openFolders}
              setOpenFolders={setOpenFolders}
              activeRequestId={activeRequestId}
              onOpenRequest={onOpenRequest}
              actions={actions}
              dragOver={dragOver}
              setDragOver={setDragOver}
            />
          ))}
          {folderlessRequests.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              collection={c}
              active={r.id === activeRequestId}
              onClick={() => onOpenRequest(r.id, c.id)}
              actions={actions}
              dragOver={dragOver}
              setDragOver={setDragOver}
            />
          ))}
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => actions.addFolder(c.id, { name: "New folder" })}
              className="h-6 px-2 rounded text-[11px] text-muted-foreground hover:bg-accent/50 inline-flex items-center gap-1"
              data-testid={`col-${c.id}-new-folder`}
            >
              <FolderPlus className="h-3 w-3" /> Folder
            </button>
            <button
              onClick={() => { const r = actions.addRequest(c.id, { name: "New request" }); onOpenRequest(r.id, c.id); }}
              className="h-6 px-2 rounded text-[11px] text-muted-foreground hover:bg-accent/50 inline-flex items-center gap-1"
              data-testid={COLL.newRequest}
            >
              <Plus className="h-3 w-3" /> Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderRow({ folder, collection, allFolders, openFolders, setOpenFolders, activeRequestId, onOpenRequest, actions, dragOver, setDragOver }) {
  const c = collection; const f = folder;
  const isOpen = openFolders[f.id] ?? true;
  const onToggle = () => setOpenFolders((o) => ({ ...o, [f.id]: !(o[f.id] ?? true) }));
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(f.name);
  const list = allFolders || [];
  const requests = c.requests.filter((r) => r.folderId === f.id);
  const subfolders = list.filter((x) => x.parentId === f.id);

  const onDropToFolder = (e) => {
    e.preventDefault(); e.stopPropagation();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (payload.collectionId === c.id) actions.moveRequest(c.id, payload.requestId, { folderId: f.id });
    setDragOver(null);
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(`fld-${f.id}`); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={onDropToFolder}
            className={cn(
              "w-full flex items-center gap-1.5 h-7 px-2 rounded text-[12px] hover:bg-accent/50 text-foreground/80",
              dragOver === `fld-${f.id}` && "bg-[hsl(var(--brand))]/10 ring-1 ring-inset ring-[hsl(var(--brand))]/40"
            )}
            data-testid={`folder-${f.id}`}
          >
            <button onClick={onToggle} className="h-5 w-5 grid place-items-center text-muted-foreground">
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {isOpen ? <FolderOpen className="h-3.5 w-3.5 text-[hsl(var(--warning))]" /> : <Folder className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />}
            {renaming ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => { actions.renameFolder(c.id, f.id, name || f.name); setRenaming(false); }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                className="bg-transparent text-[12px] outline-none flex-1 min-w-0"
              />
            ) : (
              <span onDoubleClick={() => setRenaming(true)} className="truncate">{f.name}</span>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">{requests.length}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
          <ContextMenuItem onClick={() => { const r = actions.addRequest(c.id, { name: "New request", folderId: f.id }); onOpenRequest(r.id, c.id); }}>
            <FilePlus className="h-3.5 w-3.5" /> New request here
          </ContextMenuItem>
          <ContextMenuItem onClick={() => actions.addFolder(c.id, { name: "Subfolder", parentId: f.id })}>
            <FolderPlus className="h-3.5 w-3.5" /> New subfolder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setRenaming(true)}>
            <Edit3 className="h-3.5 w-3.5" /> Rename
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-[hsl(var(--border))]" />
          <ContextMenuItem onClick={() => { actions.deleteFolder(c.id, f.id); toast.success("Folder deleted"); }} className="text-red-400">
            <Trash2 className="h-3.5 w-3.5" /> Delete folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {isOpen && (
        <div className="ml-3 border-l border-[hsl(var(--border))] pl-1.5">
          {subfolders.map((sf) => {
            const Sub = FolderRow;
            return (
              <Sub
                key={sf.id}
                folder={sf}
                collection={c}
                allFolders={list}
                openFolders={openFolders}
                setOpenFolders={setOpenFolders}
                activeRequestId={activeRequestId}
                onOpenRequest={onOpenRequest}
                actions={actions}
                dragOver={dragOver}
                setDragOver={setDragOver}
              />
            );
          })}
          {requests.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              collection={c}
              active={r.id === activeRequestId}
              onClick={() => onOpenRequest(r.id, c.id)}
              actions={actions}
              dragOver={dragOver}
              setDragOver={setDragOver}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestRow({ request, collection, active, onClick, actions, dragOver, setDragOver }) {
  const r = request; const c = collection;
  const onDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ requestId: r.id, collectionId: c.id }));
  };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (payload.collectionId === c.id && payload.requestId !== r.id) {
      actions.reorderRequest(c.id, payload.requestId, r.id);
    }
    setDragOver(null);
  };
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          draggable
          onDragStart={onDragStart}
          onDragOver={(e) => { e.preventDefault(); setDragOver(`req-${r.id}`); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={onDrop}
          onClick={onClick}
          className={cn(
            "w-full flex items-center gap-2 h-7 px-2 rounded text-[12px] hover:bg-accent/50 cursor-pointer",
            active ? "bg-accent text-foreground" : "text-muted-foreground",
            dragOver === `req-${r.id}` && "ring-1 ring-inset ring-[hsl(var(--brand))]/60"
          )}
          data-testid={COLL.request(r.id)}
        >
          <MethodBadge method={r.method} className="w-12 text-left" />
          <span className="truncate">{r.name}</span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
        <ContextMenuItem onClick={onClick}>
          <Edit3 className="h-3.5 w-3.5" /> Open
        </ContextMenuItem>
        <ContextMenuItem onClick={() => actions.updateRequest(c.id, r.id, { starred: !r.starred })}>
          ★ {r.starred ? "Unstar" : "Star"}
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[hsl(var(--border))]" />
        <ContextMenuItem onClick={() => { actions.deleteRequest(c.id, r.id); toast.success("Request deleted"); }} className="text-red-400">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
