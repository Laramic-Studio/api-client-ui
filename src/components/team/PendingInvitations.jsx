import { Loader2, Mail, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { getErrorMessage, useCancelInvitation, useResendInvitation } from "@/hooks/use-teams";

export default function PendingInvitations({ teamId, invitations, canCancel, canResend }) {
  const cancel = useCancelInvitation(teamId);
  const resend = useResendInvitation(teamId);
  const [cancelTarget, setCancelTarget] = useState(null);

  if (!invitations.length) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <Mail className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <div className="mt-3 text-[13px] font-medium">No pending invitations</div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Invitations you send will appear here until they are accepted or cancelled.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        Pending invitations
      </div>
      <div className="divide-y divide-border">
        {invitations.map((inv) => {
          const isCancelling = cancel.isPending && cancel.variables === inv.code;
          const isResending = resend.isPending && resend.variables === inv.code;
          const isBusy = isCancelling || isResending;

          return (
            <div key={inv.code} className="flex items-center gap-3 px-4 py-2 hover:bg-accent/50">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{inv.email}</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {inv.roleLabel || inv.role}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {canResend && (
                  <button
                    type="button"
                    onClick={() => {
                      resend.mutate(inv.code, {
                        onSuccess: () => toast.success(`Invitation resent to ${inv.email}`),
                        onError: (err) => toast.error(getErrorMessage(err, "Could not resend invitation.")),
                      });
                    }}
                    disabled={isBusy}
                    className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    aria-label={isResending ? "Resending invitation" : "Resend invitation"}
                    title="Resend invitation"
                  >
                    {isResending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => setCancelTarget(inv)}
                    disabled={isBusy}
                    className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))] disabled:opacity-50"
                    aria-label={isCancelling ? "Cancelling invitation" : "Cancel invitation"}
                    title="Cancel invitation"
                  >
                    {isCancelling ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
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
