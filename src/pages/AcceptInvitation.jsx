import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage, useAcceptInvitation, useInvitation } from "@/hooks/use-teams";
import { useAppStore } from "@/store/useAppStore";

export default function AcceptInvitation() {
  const { code } = useParams();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const { data, isLoading, isError } = useInvitation(code);
  const accept = useAcceptInvitation();

  const invitation = data?.invitation;

  const handleAccept = () => {
    accept.mutate(code, {
      onSuccess: () => {
        toast.success(`Joined ${invitation.team.name}`);
        navigate("/dashboard", { replace: true });
      },
      onError: (err) => toast.error(getErrorMessage(err, "Could not accept invitation.")),
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen grid place-items-center text-muted-foreground text-[13px]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading invitation…
      </div>
    );
  }

  if (isError || !invitation) {
    return (
      <div className="h-screen grid place-items-center text-muted-foreground text-[13px]">
        This invitation is invalid or has expired.
      </div>
    );
  }

  if (user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="h-screen grid place-items-center px-6 text-center">
        <div className="max-w-md rounded-md border border-border bg-card p-6">
          <Users className="h-8 w-8 text-[hsl(var(--brand))] mx-auto mb-3" />
          <div className="text-[15px] font-medium">Wrong account</div>
          <p className="mt-2 text-[13px] text-muted-foreground">
            This invitation was sent to <span className="font-mono text-foreground">{invitation.email}</span>.
            {user ? (
              <> You are signed in as <span className="font-mono text-foreground">{user.email}</span>.</>
            ) : (
              <> Please sign in with that email address first.</>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen grid place-items-center px-6">
      <div className="max-w-md w-full rounded-md border border-border bg-card p-6 text-center">
        <Users className="h-8 w-8 text-[hsl(var(--brand))] mx-auto mb-3" />
        <div className="text-[15px] font-medium">Join {invitation.team.name}</div>
        <p className="mt-2 text-[13px] text-muted-foreground">
          You&apos;ve been invited as <span className="font-mono text-foreground">{invitation.roleLabel}</span>.
        </p>
        <button
          onClick={handleAccept}
          disabled={accept.isPending}
          className="mt-5 h-10 w-full rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {accept.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {accept.isPending ? "Joining…" : "Accept invitation"}
        </button>
      </div>
    </div>
  );
}
