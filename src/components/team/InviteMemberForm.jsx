import { useEffect, useState } from "react";
import { Loader2, Mail, Plus } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage, useInviteMember } from "@/hooks/use-teams";

export default function InviteMemberForm({ teamId, canInvite, availableRoles }) {
  const [email, setEmail] = useState("");
  const defaultRole = availableRoles.find((r) => r.value === "developer")?.value
    || availableRoles[0]?.value
    || "developer";
  const [role, setRole] = useState(defaultRole);
  const invite = useInviteMember(teamId);

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);

  if (!canInvite) return null;

  const handleInvite = () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }

    invite.mutate(
      { email, role },
      {
        onSuccess: () => {
          setEmail("");
          toast.success(`Invited ${email}`);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Could not send invitation.")),
      },
    );
  };

  return (
    <div className="rounded-md border border-border bg-card p-4 mb-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Invite member</div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            disabled={invite.isPending}
            className="w-full h-9 pl-8 pr-2 rounded-md bg-muted border border-border text-[13px] placeholder:text-muted-foreground disabled:opacity-60"
            data-testid="invite-email"
          />
        </div>
        <Select value={role} onValueChange={setRole} disabled={invite.isPending}>
          <SelectTrigger className="h-9 w-40 bg-muted border-border text-[13px]" data-testid="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            {availableRoles.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={handleInvite}
          disabled={invite.isPending}
          className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-60"
          data-testid="invite-button"
        >
          {invite.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {invite.isPending ? "Inviting…" : "Invite"}
        </button>
      </div>
    </div>
  );
}
