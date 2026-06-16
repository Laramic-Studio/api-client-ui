import { useState } from "react";
import {
  ChevronDown, ChevronRight, Folder, FolderPlus, FilePlus, Plus, Trash2, Edit3, Copy, FolderOpen, Loader2,
} from "lucide-react";
import MethodBadge from "@/components/shared/MethodBadge";
import { COLL } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator,
} from "@/components/ui/context-menu";

/** Depth-first folder list — avoids recursive React components (babel dev stack overflow). */
function flattenFolders(folders, parentId = null, depth = 0) {
  const items = [];
  for (const folder of folders.filter((f) => f.parentId === parentId)) {
    items.push({ folder, depth });
    items.push(...flattenFolders(folders, folder.id, depth + 1));
  }
  return items;
}

function folderAncestorsOpen(folder, folders, openFolders) {
  let parentId = folder.parentId;
  while (parentId) {
    if (openFolders[parentId] === false) return false;
    parentId = folders.find((f) => f.id === parentId)?.parentId ?? null;
  }
  return true;
}

export function CollectionRow({
  collection,
  isOpen,
  onToggle,
  activeRequestId,
  onOpenRequest,
  openFolders,
  setOpenFolders,
  actions,
  dragOver,
  setDragOver,
  pending,
}) {
  const c = collection;
  const folders = c.folders || [];
  const folderlessRequests = c.requests.filter((r) => !r.folderId);
  const flatFolders = flattenFolders(folders);
  const isDuplicating = pending === `duplicate-collection:${c.id}`;
  const isDeleting = pending === `delete-collection:${c.id}`;

  const onDropToRoot = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
              dragOver === `col-${c.id}` && "bg-[hsl(var(--brand))]/10 ring-1 ring-inset ring-[hsl(var(--brand))]/40",
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
          <ContextMenuItem onClick={() => actions.addRequest(c.id, { name: "New request" }, onOpenRequest)}>
            <FilePlus className="h-3.5 w-3.5" /> New request
          </ContextMenuItem>
          <ContextMenuItem disabled={isDuplicating} onClick={() => actions.duplicateCollection(c.id)}>
            {isDuplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
            {isDuplicating ? "Duplicating…" : "Duplicate"}
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-[hsl(var(--border))]" />
          <ContextMenuItem disabled={isDeleting} onClick={() => actions.deleteCollection(c.id)} className="text-red-400">
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            {isDeleting ? "Deleting…" : "Delete"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isOpen && (
        <div className="ml-3 border-l border-[hsl(var(--border))] pl-1.5">
          {flatFolders.map(({ folder, depth }) => {
            if (!folderAncestorsOpen(folder, folders, openFolders)) return null;
            return (
              <FolderRow
                key={folder.id}
                folder={folder}
                depth={depth}
                collection={c}
                openFolders={openFolders}
                setOpenFolders={setOpenFolders}
                activeRequestId={activeRequestId}
                onOpenRequest={onOpenRequest}
                actions={actions}
                dragOver={dragOver}
                setDragOver={setDragOver}
                pending={pending}
              />
            );
          })}
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
              pending={pending}
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
              onClick={() => actions.addRequest(c.id, { name: "New request" }, onOpenRequest)}
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

function FolderRow({
  folder,
  depth,
  collection,
  openFolders,
  setOpenFolders,
  activeRequestId,
  onOpenRequest,
  actions,
  dragOver,
  setDragOver,
  pending,
}) {
  const c = collection;
  const f = folder;
  const isOpen = openFolders[f.id] ?? true;
  const onToggle = () => setOpenFolders((o) => ({ ...o, [f.id]: !(o[f.id] ?? true) }));
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(f.name);
  const requests = c.requests.filter((r) => r.folderId === f.id);
  const isDeleting = pending === `delete-folder:${f.id}`;

  const onDropToFolder = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (payload.collectionId === c.id) actions.moveRequest(c.id, payload.requestId, { folderId: f.id });
    setDragOver(null);
  };

  return (
    <div style={{ marginLeft: depth > 0 ? depth * 8 : 0 }}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(`fld-${f.id}`); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={onDropToFolder}
            className={cn(
              "w-full flex items-center gap-1.5 h-7 px-2 rounded text-[12px] hover:bg-accent/50 text-foreground/80",
              dragOver === `fld-${f.id}` && "bg-[hsl(var(--brand))]/10 ring-1 ring-inset ring-[hsl(var(--brand))]/40",
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
          <ContextMenuItem onClick={() => actions.addRequest(c.id, { name: "New request", folderId: f.id }, onOpenRequest)}>
            <FilePlus className="h-3.5 w-3.5" /> New request here
          </ContextMenuItem>
          <ContextMenuItem onClick={() => actions.addFolder(c.id, { name: "Subfolder", parentId: f.id })}>
            <FolderPlus className="h-3.5 w-3.5" /> New subfolder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setRenaming(true)}>
            <Edit3 className="h-3.5 w-3.5" /> Rename
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-[hsl(var(--border))]" />
          <ContextMenuItem disabled={isDeleting} onClick={() => actions.deleteFolder(c.id, f.id)} className="text-red-400">
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            {isDeleting ? "Deleting…" : "Delete folder"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {isOpen && requests.map((r) => (
        <div key={r.id} className="ml-3 border-l border-[hsl(var(--border))] pl-1.5">
          <RequestRow
            request={r}
            collection={c}
            active={r.id === activeRequestId}
            onClick={() => onOpenRequest(r.id, c.id)}
            actions={actions}
            dragOver={dragOver}
            setDragOver={setDragOver}
            pending={pending}
          />
        </div>
      ))}
    </div>
  );
}

export function RequestRow({ request, collection, active, onClick, actions, dragOver, setDragOver, pending }) {
  const r = request;
  const c = collection;
  const isDeleting = pending === `delete-request:${r.id}`;

  const onDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ requestId: r.id, collectionId: c.id }));
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
            dragOver === `req-${r.id}` && "ring-1 ring-inset ring-[hsl(var(--brand))]/60",
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
        <ContextMenuItem onClick={() => actions.patchRequest(c.id, r.id, { starred: !r.starred })}>
          {r.starred ? "Unstar" : "Star"}
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-[hsl(var(--border))]" />
        <ContextMenuItem disabled={isDeleting} onClick={() => actions.deleteRequest(c.id, r.id)} className="text-red-400">
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {isDeleting ? "Deleting…" : "Delete"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
