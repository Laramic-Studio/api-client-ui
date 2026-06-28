import { useEffect, useState } from "react";
import {
  ChevronDown, ChevronRight, Folder, FolderPlus, FilePlus, Plus, Trash2, Edit3, Copy, FolderOpen, Loader2,
  ArrowRight, FileJson,
  StarIcon,
  StarOffIcon,
  Star,
} from "lucide-react";
import MethodBadge from "@/components/shared/MethodBadge";
import { COLL } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator,
} from "@/components/ui/context-menu";

function ExplorerLabel({ children, className, onDoubleClick, title }) {
  const label = title ?? (typeof children === "string" ? children : undefined);
  return (
    <div className={cn("flex-1 min-w-0 overflow-hidden", className)}>
      <span
        className="block truncate"
        onDoubleClick={onDoubleClick}
        title={label}
      >
        {children}
      </span>
    </div>
  );
}

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
  activeExampleId,
  onOpenRequest,
  onOpenExample,
  openFolders,
  setOpenFolders,
  openRequests,
  setOpenRequests,
  actions,
  dragOver,
  setDragOver,
  pending,
}) {
  const c = collection;
  const readOnly = Boolean(actions.readOnly);
  const folders = c.folders || [];
  const folderlessRequests = c.requests.filter((r) => !r.folderId);
  const flatFolders = flattenFolders(folders);
  const isDuplicating = pending === `duplicate-collection:${c.id}`;
  const isDeleting = pending === `delete-collection:${c.id}`;
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(c.name);

  useEffect(() => {
    if (!renaming) setName(c.name);
  }, [c.name, renaming]);

  const commitRename = () => {
    const next = name.trim();
    if (next) actions.renameCollection(c.id, next);
    setRenaming(false);
  };

  const onDropToRoot = (e) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (payload.collectionId === c.id) actions.moveRequest(c.id, payload.requestId, { folderId: null });
    setDragOver(null);
  };

  return (
    <div className="select-none mb-1 min-w-0">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onDragOver={readOnly ? undefined : (e) => { e.preventDefault(); setDragOver(`col-${c.id}`); }}
            onDragLeave={readOnly ? undefined : () => setDragOver(null)}
            onDrop={readOnly ? undefined : onDropToRoot}
            className={cn(
              "w-full min-w-0 flex items-center gap-1.5 h-7 px-2 rounded text-[12.5px] hover:bg-accent/50 text-foreground/85 overflow-hidden",
              dragOver === `col-${c.id}` && "bg-[hsl(var(--brand))]/10 ring-1 ring-inset ring-[hsl(var(--brand))]/40",
            )}
          >
            <button onClick={onToggle} className="h-5 w-5 grid place-items-center text-muted-foreground" data-testid={COLL.item(c.id)}>
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            <Folder className="h-3.5 w-3.5 text-[hsl(var(--brand))]" />
            {renaming ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    setName(c.name);
                    setRenaming(false);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent text-[12.5px] font-medium outline-none flex-1 min-w-0"
              />
            ) : (
              <ExplorerLabel
                className="font-medium"
                onDoubleClick={readOnly ? undefined : (e) => { e.stopPropagation(); setRenaming(true); }}
                title={c.name}
              >
                {c.name}
              </ExplorerLabel>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground font-mono shrink-0">{c.requests.length}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
          {!readOnly && (
            <>
              <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={() => actions.addFolder(c.id, { name: "New folder" })}>
                <FolderPlus className="h-3.5 w-3.5" /> New folder
              </ContextMenuItem>
              <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={() => actions.addRequest(c.id, { name: "New request" }, onOpenRequest)}>
                <FilePlus className="h-3.5 w-3.5" /> New request
              </ContextMenuItem>
              <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={() => setRenaming(true)}>
                <Edit3 className="h-3.5 w-3.5" /> Rename
              </ContextMenuItem>
              <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" disabled={isDuplicating} onClick={() => actions.duplicateCollection(c.id)}>
                {isDuplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                {isDuplicating ? "Duplicating…" : "Duplicate"}
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-[hsl(var(--border))]" />
              <ContextMenuItem disabled={isDeleting} onClick={() => actions.deleteCollection(c.id, c.name)} className="text-red-400 cursor-pointer text-xs px-2 gap-2">
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {isDeleting ? "Deleting…" : "Delete"}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {isOpen && (
        <div className="ml-3 min-w-0 border-l border-[hsl(var(--border))] pl-1.5">
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
                activeExampleId={activeExampleId}
                onOpenRequest={onOpenRequest}
                onOpenExample={onOpenExample}
                openRequests={openRequests}
                setOpenRequests={setOpenRequests}
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
              active={r.id === activeRequestId && !activeExampleId}
              activeExampleId={activeExampleId}
              onClick={() => onOpenRequest(r.id, c.id)}
              onOpenExample={onOpenExample}
              openRequests={openRequests}
              setOpenRequests={setOpenRequests}
              actions={actions}
              dragOver={dragOver}
              setDragOver={setDragOver}
              pending={pending}
            />
          ))}
          {!readOnly && (
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
          )}
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
  activeExampleId,
  onOpenRequest,
  onOpenExample,
  openRequests,
  setOpenRequests,
  actions,
  dragOver,
  setDragOver,
  pending,
}) {
  const c = collection;
  const f = folder;
  const readOnly = Boolean(actions.readOnly);
  const isOpen = openFolders[f.id] ?? true;
  const onToggle = () => setOpenFolders((o) => ({ ...o, [f.id]: !(o[f.id] ?? true) }));
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(f.name);
  const requests = c.requests.filter((r) => r.folderId === f.id);
  const isDeleting = pending === `delete-folder:${f.id}`;

  const onDropToFolder = (e) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (payload.collectionId === c.id) actions.moveRequest(c.id, payload.requestId, { folderId: f.id });
    setDragOver(null);
  };

  return (
    <div style={{ marginLeft: depth > 0 ? depth * 8 : 0 }}>
      <ContextMenu>
        <ContextMenuTrigger asChild >
          <div
            onDragOver={readOnly ? undefined : (e) => { e.preventDefault(); setDragOver(`fld-${f.id}`); }}
            onDragLeave={readOnly ? undefined : () => setDragOver(null)}
            onDrop={readOnly ? undefined : onDropToFolder}
            className={cn(
              "w-full min-w-0 flex items-center gap-1.5 h-7 px-2 rounded text-[12px] hover:bg-accent/50 text-foreground/80 overflow-hidden",
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
              <ExplorerLabel onDoubleClick={readOnly ? undefined : () => setRenaming(true)} title={f.name}>
                {f.name}
              </ExplorerLabel>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">{requests.length}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent data-side="right" className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
          {!readOnly && (
            <>
              <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={() => actions.addRequest(c.id, { name: "New request", folderId: f.id }, onOpenRequest)}>
                <FilePlus className="h-3.5 w-3.5" /> New request
              </ContextMenuItem>
              <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={() => actions.addFolder(c.id, { name: "Subfolder", parentId: f.id })}>
                <FolderPlus className="h-3.5 w-3.5" /> New subfolder
              </ContextMenuItem>
              <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={() => setRenaming(true)}>
                <Edit3 className="h-3.5 w-3.5" /> Rename
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-[hsl(var(--border))]" />
              <ContextMenuItem
                disabled={isDeleting}
                onClick={() => actions.deleteFolder(c.id, f.id, f.name)}
                className="cursor-pointer text-xs px-2 gap-2 text-red-400"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {isDeleting ? "Deleting…" : "Delete folder"}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      {isOpen && requests.map((r) => (
        <div key={r.id} className="ml-3 min-w-0 border-l border-[hsl(var(--border))] pl-1.5">
          <RequestRow
            request={r}
            collection={c}
            active={r.id === activeRequestId && !activeExampleId}
            activeExampleId={activeExampleId}
            onClick={() => onOpenRequest(r.id, c.id)}
            onOpenExample={onOpenExample}
            openRequests={openRequests}
            setOpenRequests={setOpenRequests}
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

export function RequestRow({
  request,
  collection,
  active,
  activeExampleId,
  onClick,
  onOpenExample,
  openRequests,
  setOpenRequests,
  actions,
  dragOver,
  setDragOver,
  pending,
}) {
  const r = request;
  const c = collection;
  const readOnly = Boolean(actions.readOnly);
  const examples = r.examples || [];
  const hasExamples = examples.length > 0;
  const isDeleting = pending === `delete-request:${r.id}`;
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(r.name);

  const examplesExpanded = openRequests[r.id] ?? (
    hasExamples && examples.some((example) => example.id === activeExampleId)
  );

  useEffect(() => {
    if (!renaming) setName(r.name);
  }, [r.name, renaming]);

  const commitRename = () => {
    const next = name.trim() || r.name;
    actions.renameRequest(c.id, r.id, next);
    setRenaming(false);
  };

  const onDragStart = (e) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ requestId: r.id, collectionId: c.id }));
  };
  const onDrop = (e) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    const payload = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
    if (payload.collectionId === c.id && payload.requestId !== r.id) {
      actions.reorderRequest(c.id, payload.requestId, r.id);
    }
    setDragOver(null);
  };

  const toggleExamples = (e) => {
    e.stopPropagation();
    setOpenRequests((open) => ({ ...open, [r.id]: !examplesExpanded }));
  };

  return (
    <div className="min-w-0">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            draggable={!readOnly}
            onDragStart={onDragStart}
            onDragOver={readOnly ? undefined : (e) => { e.preventDefault(); setDragOver(`req-${r.id}`); }}
            onDragLeave={readOnly ? undefined : () => setDragOver(null)}
            onDrop={readOnly ? undefined : onDrop}
            onClick={onClick}
            className={cn(
              "w-full min-w-0 flex items-center gap-1.5 h-7 px-2 rounded text-[12px] hover:bg-accent/50 cursor-pointer overflow-hidden",
              active ? "bg-accent text-foreground" : "text-muted-foreground",
              dragOver === `req-${r.id}` && "ring-1 ring-inset ring-[hsl(var(--brand))]/60",
            )}
            data-testid={COLL.request(r.id)}
          >
            {hasExamples ? (
              <button
                type="button"
                onClick={toggleExamples}
                className="h-5 w-5 shrink-0 grid place-items-center text-muted-foreground hover:text-foreground"
                aria-label={examplesExpanded ? "Collapse examples" : "Expand examples"}
              >
                {examplesExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            ) : (
              <span className="h-5 w-5 shrink-0" />
            )}
            <MethodBadge method={r.method} short className="w-10 text-left shrink-0" />
            {renaming ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    setName(r.name);
                    setRenaming(false);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent text-[12px] outline-none flex-1 min-w-0"
              />
            ) : (
              <ExplorerLabel
                onDoubleClick={readOnly ? undefined : (e) => { e.stopPropagation(); setRenaming(true); }}
                title={r.name}
              >
                {r.name}
              </ExplorerLabel>
            )}
            {hasExamples && (
              <span className="text-[10px] text-muted-foreground font-mono shrink-0">{examples.length}</span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent data-side="right" className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
          <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={onClick}>
            <ArrowRight className="h-3.5 w-3.5" /> Open
          </ContextMenuItem>
          {!readOnly && (
            <>
              <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={() => actions.patchRequest(c.id, r.id, { starred: !r.starred })}>
                {r.starred ? <StarIcon className="h-3.5 w-3.5" /> : <StarOffIcon className="h-3.5 w-3.5" />} {r.starred ? "Unstar" : "Star"}
              </ContextMenuItem>
              <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={() => setRenaming(true)}>
                <Edit3 className="h-3.5 w-3.5" /> Rename
              </ContextMenuItem>
              <ContextMenuItem
                className="cursor-pointer text-xs px-2 gap-2"
                disabled={!actions.canAddExample?.(r)}
                onClick={() => actions.addExample(c.id, r)}
              >
                <FileJson className="h-3.5 w-3.5" /> Add example
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-[hsl(var(--border))]" />
              <ContextMenuItem disabled={isDeleting} onClick={() => actions.deleteRequest(c.id, r.id, r.name)} className="cursor-pointer text-xs px-2 gap-2 text-red-400">
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {isDeleting ? "Deleting…" : "Delete"}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {examplesExpanded && hasExamples && (
        <div className="min-w-0">
          {examples.map((example) => (
            <ExampleRow
              key={example.id}
              example={example}
              request={r}
              collection={c}
              active={example.id === activeExampleId}
              onOpen={() => onOpenExample(r.id, c.id, example.id)}
              actions={actions}
              pending={pending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExampleRow({ example, request, collection, active, onOpen, actions, pending }) {
  const readOnly = Boolean(actions.readOnly);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(example.name);
  const isDeleting = pending === `delete-example:${example.id}`;

  useEffect(() => {
    if (!renaming) setName(example.name);
  }, [example.name, renaming]);

  const commitRename = () => {
    const next = name.trim() || example.name;
    actions.renameExample(collection.id, request.id, example.id, next);
    setRenaming(false);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={onOpen}
          className={cn(
            "w-full min-w-0 flex items-center gap-1.5 h-7 px-2 rounded text-[12px] hover:bg-accent/50 cursor-pointer overflow-hidden",
            active ? "bg-accent text-foreground" : "text-muted-foreground",
          )}
          data-testid={COLL.example(example.id)}
        >
          <span className="h-5 w-5 shrink-0" aria-hidden />
          <span className="w-10 shrink-0 inline-flex items-center">
            <FileJson className="h-3.5 w-3.5 text-[hsl(var(--brand))]" />
          </span>
          {renaming ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") {
                  setName(example.name);
                  setRenaming(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-[12px] outline-none flex-1 min-w-0"
            />
          ) : (
            <ExplorerLabel
              onDoubleClick={readOnly ? undefined : (e) => { e.stopPropagation(); setRenaming(true); }}
              title={example.name}
            >
              <span className="inline-flex items-center gap-1 min-w-0">
                {example.isDefault && (
                  <Star className="h-3 w-3 text-[hsl(var(--warning))] shrink-0" fill="currentColor" />
                )}
                <span className="truncate">{example.name}</span>
              </span>
            </ExplorerLabel>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent data-side="right" className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
        <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={onOpen}>
          <ArrowRight className="h-3.5 w-3.5" /> Open
        </ContextMenuItem>
        {!readOnly && (
          <>
            <ContextMenuItem className="cursor-pointer text-xs px-2 gap-2" onClick={() => setRenaming(true)}>
              <Edit3 className="h-3.5 w-3.5" /> Rename
            </ContextMenuItem>
            {!example.isDefault && (
              <ContextMenuItem
                className="cursor-pointer text-xs px-2 gap-2"
                onClick={() => actions.setDefaultExample(collection.id, request.id, example.id)}
              >
                <Star className="h-3.5 w-3.5" /> Set as default
              </ContextMenuItem>
            )}
            <ContextMenuSeparator className="bg-[hsl(var(--border))]" />
            <ContextMenuItem
              disabled={isDeleting}
              onClick={() => actions.deleteExample(collection.id, request.id, example.id, example.name)}
              className="text-red-400 cursor-pointer text-xs px-2 gap-2"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {isDeleting ? "Deleting…" : "Delete"}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
