import { useState } from "react";
import { Briefcase, Check, Copy, Edit, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import DeleteWorkspaceDialog from "@/components/workspaces/DeleteWorkspaceDialog";

export default function WorkspaceCard({
  ws,
  isActive,
  onActivate,
  onRename,
  onDuplicate,
  onDelete,
  isDeleting,
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(ws.name);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "rounded-md border bg-card p-4 hover:border-white/20",
          isActive ? "border-[hsl(var(--brand))]/60" : "border-border",
        )}
        data-testid={`workspace-card-${ws.id}`}
      >
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
                onBlur={() => {
                  onRename(val || ws.name);
                  setEditing(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                className="bg-transparent text-[14px] font-medium outline-none w-full"
              />
            ) : (
              <div className="text-[14px] font-medium truncate">{ws.name}</div>
            )}
            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wider inline-flex items-center gap-2">
              <Users className="h-3 w-3" /> {ws.members} members
              {ws.isPersonal && (
                <span className="text-[10px] normal-case tracking-normal">· Personal</span>
              )}
            </div>
          </div>
          {isActive && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[hsl(var(--brand))]/40 text-[10px] uppercase tracking-wider font-mono text-[hsl(var(--brand))]">
              <Check className="h-2.5 w-2.5" /> Active
            </span>
          )}
        </div>
        <p className="mt-3 text-[12.5px] text-muted-foreground line-clamp-2">
          {ws.description || "No description"}
        </p>
        <div className="mt-4 flex items-center gap-1">
          {!isActive && (
            <button
              onClick={onActivate}
              className="h-7 px-2.5 rounded text-[12px] border border-border hover:bg-accent/50"
            >
              Activate
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-foreground/85"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDuplicate}
            className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-foreground/85"
            title="Duplicate via sync — coming soon"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {!ws.isPersonal && (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={isDeleting}
              className="ml-auto h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <DeleteWorkspaceDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        workspace={ws}
        onConfirm={onDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
