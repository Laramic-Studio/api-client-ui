import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WorkspaceNotice from "@/components/onboarding/WorkspaceNotice";
import OnboardingSteps from "@/components/onboarding/OnboardingSteps";
import { authButtonClass, authInputClass } from "@/components/auth/AuthField";
import {
  collectFieldErrors,
  toastAuthError,
  toastAuthSuccess,
  toastAuthValidation,
} from "@/lib/auth/toast";
import { useCompleteOnboarding } from "@/hooks/use-auth";
import { useAppStore } from "@/store/useAppStore";

export default function OnboardingIndividual() {
  const navigate = useNavigate();
  const complete = useCompleteOnboarding();
  const currentTeam = useAppStore((s) => s.currentTeam);
  const clearOnboardingDraft = useAppStore((s) => s.clearOnboardingDraft);

  const [workspaceName, setWorkspaceName] = useState(currentTeam?.name || "");

  const personalTeamName = currentTeam?.name || currentTeam?.slug;

  const submit = () => {
    complete.mutate(
      {
        accountType: "individual",
        workspaceName: workspaceName.trim() || undefined,
      },
      {
        onSuccess: () => {
          clearOnboardingDraft();
          toastAuthSuccess("All set — welcome to Noidr");
          navigate("/dashboard", { replace: true });
        },
        onError: (err) => {
          const fields = collectFieldErrors(err);
          if (fields.workspace_name) {
            toastAuthValidation(fields.workspace_name);
            return;
          }
          toastAuthError(err, "Could not complete setup");
        },
      }
    );
  };

  return (
    <AuthShell
      title="Name your workspace"
      subtitle="Optional — you can change this later in settings."
      backTo="/onboarding"
      backLabel="Account type"
    >
      <div className="space-y-5 w-full">
        <OnboardingSteps current={2} total={2} />

        <WorkspaceNotice teamName={personalTeamName} />

        <div>
          <Label className="text-[11px] uppercase  text-muted-foreground">
            Workspace name
          </Label>
          <Input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            data-testid="onboarding-workspace-name"
            className={`${authInputClass} mt-1`}
            placeholder="My workspace"
          />
        </div>

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
