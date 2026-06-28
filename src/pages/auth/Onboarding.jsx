import { useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import AccountTypePicker from "@/components/onboarding/AccountTypePicker";
import WorkspaceNotice from "@/components/onboarding/WorkspaceNotice";
import OnboardingSteps from "@/components/onboarding/OnboardingSteps";
import { authButtonClass } from "@/components/auth/AuthField";
import { useAppStore } from "@/store/useAppStore";

export default function Onboarding() {
  const navigate = useNavigate();
  const currentTeam = useAppStore((s) => s.currentTeam);
  const draft = useAppStore((s) => s.onboardingDraft);
  const setOnboardingDraft = useAppStore((s) => s.setOnboardingDraft);

  const accountType = draft.accountType || "individual";
  const personalTeamName = currentTeam?.name || currentTeam?.slug;

  const continueNext = () => {
    setOnboardingDraft({ accountType });
    if (accountType === "organisation") {
      navigate("/onboarding/organisation");
      return;
    }
    navigate("/onboarding/individual");
  };

  return (
    <AuthShell>
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Tell us about yourself</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This personalizes your workspace and branding.
        </p>
      </div>

      <div className="mt-8 space-y-5 w-full">
        <OnboardingSteps current={1} total={accountType === "organisation" ? 3 : 2} />

        <WorkspaceNotice teamName={personalTeamName} />

        <AccountTypePicker
          value={accountType}
          onChange={(next) => setOnboardingDraft({ accountType: next })}
        />

        <Button
          onClick={continueNext}
          data-testid="onboarding-continue"
          className={authButtonClass}
        >
          Continue
        </Button>
      </div>
    </AuthShell>
  );
}
