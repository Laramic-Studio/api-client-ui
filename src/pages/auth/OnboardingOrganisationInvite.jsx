import { useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import InviteTeamForm from "@/components/onboarding/InviteTeamForm";
import OnboardingSteps from "@/components/onboarding/OnboardingSteps";
import { authButtonClass } from "@/components/auth/AuthField";
import {
  collectFieldErrors,
  toastAuthError,
  toastAuthSuccess,
  toastAuthValidation,
} from "@/lib/auth/toast";
import { useCompleteOnboarding } from "@/hooks/use-auth";
import { useAppStore } from "@/store/useAppStore";

function parseInvites(rows) {
  return rows
    .map((row) => ({
      email: row.email.trim(),
      role: row.role || "developer",
    }))
    .filter((row) => row.email);
}

export default function OnboardingOrganisationInvite() {
  const navigate = useNavigate();
  const complete = useCompleteOnboarding();
  const draft = useAppStore((s) => s.onboardingDraft);
  const setOnboardingDraft = useAppStore((s) => s.setOnboardingDraft);
  const clearOnboardingDraft = useAppStore((s) => s.clearOnboardingDraft);

  const invites = draft.invites || [{ email: "", role: "developer" }];

  if (!draft.organisationName?.trim()) {
    navigate("/onboarding/organisation", { replace: true });
    return null;
  }

  const submit = () => {
    const parsedInvites = parseInvites(invites);

    complete.mutate(
      {
        accountType: "organisation",
        organisationName: draft.organisationName,
        teamSize: draft.teamSize,
        logoFile: draft.logoFile || undefined,
        invites: parsedInvites,
      },
      {
        onSuccess: (data) => {
          clearOnboardingDraft();
          const sent = data?.invitations_sent || 0;
          toastAuthSuccess(
            sent > 0
              ? `Welcome to Noidr — ${sent} invite${sent === 1 ? "" : "s"} sent`
              : "All set — welcome to Noidr"
          );
          navigate("/dashboard", { replace: true });
        },
        onError: (err) => {
          const fields = collectFieldErrors(err);
          const first = Object.values(fields)[0];
          if (first) {
            toastAuthValidation(first);
            return;
          }
          toastAuthError(err, "Could not complete setup");
        },
      }
    );
  };

  return (
    <AuthShell
      title="Invite your team"
      subtitle="Optional — you can invite people later from Team settings."
      backTo="/onboarding/organisation"
      backLabel="Organisation details"
    >
      <div className="space-y-5 w-full">
        <OnboardingSteps current={3} total={3} />

        <InviteTeamForm
          invites={invites}
          onChange={(next) => setOnboardingDraft({ invites: next })}
        />

        <Button
          onClick={submit}
          disabled={complete.isPending}
          data-testid="onboarding-submit"
          className={authButtonClass}
        >
          {complete.isPending ? "Finishing…" : "Finish setup"}
        </Button>
      </div>
    </AuthShell>
  );
}
