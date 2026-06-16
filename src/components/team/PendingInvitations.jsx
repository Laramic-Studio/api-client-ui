import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { getErrorMessage, useCancelInvitation } from "@/hooks/use-teams";

export default function PendingInvitations({ teamId, invitations, canCancel }) {
  const cancel = useCancelInvitation(teamId);
  const [cancelTarget, setCancelTarget] = useState(null);

  if (!invitations.length) return null;

  return (
    <div className="mt-5 rounded-md border border-border bg-card overflow-hidden">
      <div className="px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        Pending invitations
      </div>
      <div className="divide-y divide-border">
        {invitations.map((inv) => {
          const isCancelling = cancel.isPending && cancel.variables === inv.code;

          return (
            <div key={inv.code} className="flex items-center gap-3 px-4 py-2 hover:bg-accent/50">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{inv.email}</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {inv.roleLabel || inv.role}
                </div>
              </div>
              {canCancel && (
                <button
                  onClick={() => setCancelTarget(inv)}
                  disabled={isCancelling}
                  className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))] disabled:opacity-50"
                  aria-label={isCancelling ? "Cancelling invitation" : "Cancel invitation"}
                >
                  {isCancelling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => { if (!open) setCancelTarget(null); }}
        title="Cancel invitation"
        description={cancelTarget ? `Cancel the invitation sent to ${cancelTarget.email}?` : ""}
        confirmLabel="Cancel invitation"
        onConfirm={() => {
          if (!cancelTarget) return;
          cancel.mutate(cancelTarget.code, {
            onSuccess: () => {
              toast.success("Invitation cancelled");
              setCancelTarget(null);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Could not cancel invitation.")),
          });
        }}
        loading={cancel.isPending}
      />
    </div>
  );
}
