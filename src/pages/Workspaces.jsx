import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Plus, Copy, Trash2, Edit, Check, Briefcase, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Workspaces() {
  const workspaces = useAppStore((s) => s.workspaces);
  const active = useAppStore((s) => s.activeWorkspaceId);
  const create = useAppStore((s) => s.createWorkspace);
  const rename = useAppStore((s) => s.renameWorkspace);
  const dup = useAppStore((s) => s.duplicateWorkspace);
  const del = useAppStore((s) => s.deleteWorkspace);
  const setActive = useAppStore((s) => s.setActiveWorkspace);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// workspaces</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Workspaces</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Isolated environments, collections, and team members.</p>
        </div>
        <button
          onClick={() => { const w = create(`Workspace ${workspaces.length + 1}`); toast.success(`Created ${w.name}`); }}
          className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2"
          data-testid="workspaces-new"
        >
          <Plus className="h-3.5 w-3.5" /> New workspace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {workspaces.map((w) => (
          <Card
            key={w.id}
            ws={w}
            isActive={w.id === active}
            onActivate={() => { setActive(w.id); toast.success(`Switched to ${w.name}`); }}
            onRename={(name) => rename(w.id, name)}
            onDuplicate={() => { dup(w.id); toast.success(`Duplicated ${w.name}`); }}
            onDelete={() => { del(w.id); toast.success(`Deleted ${w.name}`); }}
          />
        ))}
      </div>
    </div>
  );
}

function Card({ ws, isActive, onActivate, onRename, onDuplicate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(ws.name);

  return (
    <div className={cn("rounded-md border bg-card p-4 hover:border-white/20", isActive ? "border-[hsl(var(--brand))]/60" : "border-border")}
         data-testid={`workspace-card-${ws.id}`}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-md bg-gradient-to-br from-[#6366F1] to-[#4F46E5] grid place-items-center">
          <Briefcase className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onBlur={() => { onRename(val || ws.name); setEditing(false); }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="bg-transparent text-[14px] font-medium outline-none w-full"
            />
          ) : (
            <div className="text-[14px] font-medium truncate">{ws.name}</div>
          )}
          <div className="text-[11px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wider inline-flex items-center gap-2">
            <Users className="h-3 w-3" /> {ws.members} members
          </div>
        </div>
        {isActive && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[hsl(var(--brand))]/40 text-[10px] uppercase tracking-wider font-mono text-[hsl(var(--brand))]">
            <Check className="h-2.5 w-2.5" /> Active
          </span>
        )}
      </div>
      <p className="mt-3 text-[12.5px] text-muted-foreground line-clamp-2">{ws.description || "No description"}</p>
      <div className="mt-4 flex items-center gap-1">
        {!isActive && (
          <button onClick={onActivate} className="h-7 px-2.5 rounded text-[12px] border border-border hover:bg-accent/50">
            Activate
          </button>
        )}
        <button onClick={() => setEditing(true)} className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-foreground/85">
          <Edit className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDuplicate} className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-foreground/85">
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="ml-auto h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))]">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
