import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getErrorMessage, useRemoveMember, useUpdateMemberRole } from "@/hooks/use-teams";

function formatLastActive(lastActive) {
  if (!lastActive) return "—";
  const date = new Date(lastActive);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export default function MembersTable({
  teamId,
  members,
  availableRoles,
  canUpdateMember,
  canRemoveMember,
}) {
  const updateRole = useUpdateMemberRole(teamId);
  const removeMember = useRemoveMember(teamId);
  const [removeTarget, setRemoveTarget] = useState(null);

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-[1fr_120px_120px_120px_40px] gap-2 px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-geom">
        <div>Member</div>
        <div>Role</div>
        <div>Status</div>
        <div>Last active</div>
        <div />
      </div>
      <div className="divide-y divide-border">
        {members.map((m) => {
          const isOwner = m.role === "owner";
          const roleEditable = canUpdateMember && !isOwner;
          const isUpdatingRole = updateRole.isPending && updateRole.variables?.memberId === m.id;
          const isRemoving = removeMember.isPending && removeMember.variables === m.id;

          return (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_120px_120px_120px_40px] gap-2 items-center px-4 py-2 hover:bg-accent/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#22C55E] grid place-items-center text-[11px] font-semibold">
                  {m.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate font-geom">{m.email}</div>
                </div>
              </div>
              {roleEditable ? (
                <Select
                  value={m.role === "member" ? "developer" : m.role}
                  disabled={isUpdatingRole || isRemoving}
                  onValueChange={(role) => {
                    updateRole.mutate(
                      { memberId: m.id, role },
                      {
                        onError: (err) => toast.error(getErrorMessage(err, "Could not update role.")),
                      },
                    );
                  }}
                >
                  <SelectTrigger className="h-8 bg-muted border-border text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {availableRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-[12px] font-geom">{m.roleLabel || m.role}</div>
              )}
              <div className="text-[11px] font-geom uppercase tracking-wider inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    m.online ? "bg-[hsl(var(--success))]" : "bg-zinc-500",
                  )}
                />
                {m.online ? "Online" : "Offline"}
              </div>
              <div className="text-[11px] text-muted-foreground font-geom">
                {formatLastActive(m.lastActive)}
              </div>
              {canRemoveMember && !isOwner ? (
                <button
                  onClick={() => setRemoveTarget(m)}
                  disabled={isRemoving || isUpdatingRole}
                  className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))] disabled:opacity-50"
                  aria-label={isRemoving ? "Removing member" : "Remove member"}
                >
                  <Trash2 className={cn("h-3.5 w-3.5", isRemoving && "animate-pulse")} />
                </button>
              ) : (
                <div />
              )}
            </div>
          );
        })}
      </div>
      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
        title="Remove team member"
        description={removeTarget ? `Remove ${removeTarget.name} from this workspace?` : ""}
        confirmLabel="Remove"
        onConfirm={() => {
          if (!removeTarget) return;
          removeMember.mutate(removeTarget.id, {
            onSuccess: () => {
              toast.success(`Removed ${removeTarget.name}`);
              setRemoveTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Could not remove member.")),
          });
        }}
        loading={removeMember.isPending}
      />
    </div>
  );
}
