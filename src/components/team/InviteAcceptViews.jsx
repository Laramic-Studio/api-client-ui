import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { authButtonClass } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { loginPathForInvite, registerPathForInvite } from "@/lib/invite-flow";

function teamInitials(name) {
  return String(name || "T")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "T";
}

function InvitationSummary({ team, roleLabel }) {
  return (
    <div className="mt-6 rounded-md border border-border bg-card p-4 text-left">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        Workspace
      </div>
      <div className="mt-1.5 flex items-center gap-2.5">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[hsl(var(--brand)/0.3)] bg-[hsl(var(--brand)/0.15)] font-mono text-[11px]">
          {teamInitials(team.name)}
        </div>
        <div>
          <div className="text-sm font-medium">{team.name}</div>
          {team.slug && (
            <div className="font-mono text-[11.5px] text-muted-foreground">{team.slug}</div>
          )}
        </div>
      </div>
      <div className="mt-4 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        Your role
      </div>
      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded border border-border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider">
        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand))]" />
        {roleLabel}
      </div>
    </div>
  );
}

export function InviteAcceptLoading() {
  return (
    <AuthShell>
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    </AuthShell>
  );
}

export function InviteAcceptNotFound({ onGoDashboard }) {
  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-2xl font-medium tracking-tight">Invitation not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invite may have expired or already been handled.
        </p>
        <button
          type="button"
          onClick={onGoDashboard}
          className="mt-6 text-sm text-[hsl(var(--brand))] hover:underline"
        >
          Go to API builder
        </button>
      </div>
    </AuthShell>
  );
}

export function InviteAcceptGuest({
  invitation,
  inviteCode,
  loginState,
}) {
  const { team, roleLabel, invitedBy, email, requiresSignup } = invitation;
  const registerHref = registerPathForInvite(inviteCode);
  const loginHref = loginPathForInvite(inviteCode);

  return (
    <AuthShell>
      <div className="text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-md bg-[hsl(var(--brand))] font-mono text-sm text-white">
          {teamInitials(team.name)}
        </div>
        <h1 className="mt-4 text-2xl font-medium tracking-tight">Join {team.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {invitedBy ? (
            <>
              <span className="text-foreground">{invitedBy.name}</span> invited you to collaborate on Noidr.
            </>
          ) : (
            <>You&apos;ve been invited to collaborate on Noidr.</>
          )}
          {email ? (
            <>
              {" "}
              Use <span className="font-mono text-foreground">{email}</span> when signing up.
            </>
          ) : null}
        </p>

        <InvitationSummary team={team} roleLabel={roleLabel} />

        <div className="mt-6 space-y-2">
          {requiresSignup !== false ? (
            <Link
              to={registerHref}
              data-testid="invite-create-account"
              className={`${authButtonClass} inline-flex items-center justify-center`}
            >
              Create account to accept
            </Link>
          ) : (
            <Link
              to={loginHref}
              state={loginState}
              data-testid="invite-sign-in"
              className={`${authButtonClass} inline-flex items-center justify-center`}
            >
              Sign in to accept
            </Link>
          )}
          {requiresSignup !== false ? (
            <p className="text-[12.5px] text-muted-foreground">
              Already have an account?{" "}
              <Link to={loginHref} state={loginState} className="text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </AuthShell>
  );
}

export function InviteAcceptWrongAccount({ invitation, userEmail, inviteCode }) {
  const loginHref = loginPathForInvite(inviteCode);

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-2xl font-medium tracking-tight">Wrong account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invitation was sent to{" "}
          <span className="font-mono text-foreground">{invitation.email}</span>.
          {userEmail ? (
            <>
              {" "}
              You are signed in as{" "}
              <span className="font-mono text-foreground">{userEmail}</span>.
            </>
          ) : (
            <> Please sign in with that email address.</>
          )}
        </p>
        <Link to={loginHref} className={`${authButtonClass} mt-6 inline-flex`}>
          Sign in with the invited email
        </Link>
      </div>
    </AuthShell>
  );
}

export function InviteAcceptAuthenticated({
  invitation,
  onAccept,
  isPending,
}) {
  const { team, roleLabel, invitedBy } = invitation;

  return (
    <AuthShell>
      <div className="text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-md bg-[hsl(var(--brand))] font-mono text-sm text-white">
          {teamInitials(team.name)}
        </div>
        <h1 className="mt-4 text-2xl font-medium tracking-tight">You&apos;ve been invited</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {invitedBy ? (
            <>
              <span className="text-foreground">{invitedBy.name}</span> invited you to join{" "}
              <span className="font-medium text-foreground">{team.name}</span>.
            </>
          ) : (
            <>
              Join <span className="font-medium text-foreground">{team.name}</span> on Noidr.
            </>
          )}
        </p>

        <InvitationSummary team={team} roleLabel={roleLabel} />

        <Button
          type="button"
          data-testid="invite-accept"
          onClick={onAccept}
          disabled={isPending}
          className={`${authButtonClass} mt-6`}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Accepting…
            </>
          ) : (
            "Accept invitation"
          )}
        </Button>
      </div>
    </AuthShell>
  );
}
