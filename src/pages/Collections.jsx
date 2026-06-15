import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import MethodBadge from "@/components/shared/MethodBadge";
import {
  Plus, Search, Star, Archive, Copy, Trash2, Folder, ChevronRight, ChevronDown,
} from "lucide-react";
import { COLL } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator,
} from "@/components/ui/context-menu";

export default function Collections() {
  const collections = useAppStore((s) => s.collectionsMap[s.activeWorkspaceId] || []);
  const create = useAppStore((s) => s.createCollection);
  const del = useAppStore((s) => s.deleteCollection);
  const dup = useAppStore((s) => s.duplicateCollection);
  const update = useAppStore((s) => s.updateCollection);
  const addRequest = useAppStore((s) => s.addRequest);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState({});

  const filtered = collections
    .filter((c) => (showArchived ? c.archived : !c.archived))
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="h-full overflow-auto p-6">
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
            onClick={() => { const c = create("New Collection"); toast.success(`Created ${c.name}`); }}
            data-testid={COLL.newCollection}
            className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" /> New collection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((c) => {
          const isOpen = open[c.id];
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
                          onChange={(e) => update(c.id, { name: e.target.value })}
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
                        onClick={() => {
                          const req = addRequest(c.id, { name: "New request" });
                          navigate(`/builder/${req.id}`);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-muted-foreground hover:bg-accent/50"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add request
                      </button>
                    </div>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-card border-border text-foreground">
                <ContextMenuItem onClick={() => update(c.id, { pinned: !c.pinned })}>
                  <Star className="h-3.5 w-3.5" /> {c.pinned ? "Unpin" : "Pin"}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => dup(c.id)}>
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </ContextMenuItem>
                <ContextMenuItem onClick={() => update(c.id, { archived: !c.archived })}>
                  <Archive className="h-3.5 w-3.5" /> {c.archived ? "Restore" : "Archive"}
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-accent" />
                <ContextMenuItem onClick={() => { del(c.id); toast.success("Collection deleted"); }} className="text-red-400">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
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
    </div>
  );
}
