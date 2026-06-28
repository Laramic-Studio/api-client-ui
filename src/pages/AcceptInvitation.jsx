import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  InviteAcceptAuthenticated,
  InviteAcceptGuest,
  InviteAcceptLoading,
  InviteAcceptNotFound,
  InviteAcceptWrongAccount,
} from "@/components/team/InviteAcceptViews";
import { getErrorMessage, useAcceptInvitation, useInvitation } from "@/hooks/use-teams";
import { clearPendingInvite, inviteAcceptPath, storePendingInviteCode } from "@/lib/invite-flow";
import { useAppStore } from "@/store/useAppStore";

export default function AcceptInvitation() {
  const { code } = useParams();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const authBootstrapped = useAppStore((s) => s.authBootstrapped);
  const { data, isLoading, isError } = useInvitation(code);
  const accept = useAcceptInvitation();

  useEffect(() => {
    if (code) storePendingInviteCode(code);
  }, [code]);

  const invitation = data?.invitation;
  const invitePath = inviteAcceptPath(code);
  const loginState = invitePath ? { from: invitePath } : undefined;

  const handleAccept = () => {
    accept.mutate(code, {
      onSuccess: () => {
        clearPendingInvite();
        toast.success(`Joined ${invitation?.team?.name || "workspace"}`);
        navigate("/builder", { replace: true });
      },
      onError: (err) => toast.error(getErrorMessage(err, "Could not accept invitation.")),
    });
  };

  if (!authBootstrapped || isLoading) {
    return <InviteAcceptLoading />;
  }

  if (isError || !invitation) {
    return (
      <InviteAcceptNotFound
        onGoDashboard={() => navigate(user ? "/builder" : "/login", { replace: true })}
      />
    );
  }

  if (!user) {
    return (
      <InviteAcceptGuest
        invitation={invitation}
        inviteCode={code}
        loginState={loginState}
      />
    );
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <InviteAcceptWrongAccount
        invitation={invitation}
        userEmail={user.email}
        inviteCode={code}
      />
    );
  }

  return (
    <InviteAcceptAuthenticated
      invitation={invitation}
      onAccept={handleAccept}
      isPending={accept.isPending}
    />
  );
}
