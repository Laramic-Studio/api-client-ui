import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage, useCancelInvitation } from "@/hooks/use-teams";

export default function PendingInvitations({ teamId, invitations, canCancel }) {
  const cancel = useCancelInvitation(teamId);

  if (!invitations.length) return null;

  return (
    <div className="mt-5 rounded-md border border-border bg-card overflow-hidden">
      <div className="px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        Pending invitations
      </div>
      <div className="divide-y divide-border">
        {invitations.map((inv) => (
          <div key={inv.code} className="flex items-center gap-3 px-4 py-2 hover:bg-accent/50">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{inv.email}</div>
              <div className="text-[11px] text-muted-foreground font-mono capitalize">
                {inv.roleLabel || inv.role}
              </div>
            </div>
            {canCancel && (
              <button
                onClick={() => {
                  cancel.mutate(inv.code, {
                    onSuccess: () => toast.success("Invitation cancelled"),
                    onError: (err) => toast.error(getErrorMessage(err, "Could not cancel invitation.")),
                  });
                }}
                className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
