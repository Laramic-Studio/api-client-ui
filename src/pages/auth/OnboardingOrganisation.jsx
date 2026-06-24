import { useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import OrganisationDetailsForm from "@/components/onboarding/OrganisationDetailsForm";
import OnboardingSteps from "@/components/onboarding/OnboardingSteps";
import { authButtonClass } from "@/components/auth/AuthField";
import { toastAuthValidation } from "@/lib/auth/toast";
import { TEAM_SIZES } from "@/components/onboarding/constants";
import { useAppStore } from "@/store/useAppStore";

export default function OnboardingOrganisation() {
  const navigate = useNavigate();
  const draft = useAppStore((s) => s.onboardingDraft);
  const setOnboardingDraft = useAppStore((s) => s.setOnboardingDraft);

  const organisationName = draft.organisationName || "";
  const size = draft.teamSize || TEAM_SIZES[1];
  const logoFile = draft.logoFile || null;

  const continueNext = () => {
    if (!organisationName.trim()) {
      toastAuthValidation("Add an organisation name");
      return;
    }

    setOnboardingDraft({
      accountType: "organisation",
      organisationName: organisationName.trim(),
      teamSize: size,
      logoFile,
    });
    navigate("/onboarding/organisation/invite");
  };

  return (
    <AuthShell
      title="Organisation details"
      subtitle="Set up your team workspace and branding."
      backTo="/onboarding"
      backLabel="Account type"
    >
      <div className="space-y-5 w-full">
        <OnboardingSteps current={2} total={3} />

        <OrganisationDetailsForm
          organisationName={organisationName}
          size={size}
          logoFile={logoFile}
          onChange={(patch) => {
            const next = { ...patch };
            if ("size" in patch) {
              next.teamSize = patch.size;
              delete next.size;
            }
            setOnboardingDraft(next);
          }}
        />

        <Button
          onClick={continueNext}
          data-testid="onboarding-organisation-continue"
          className={authButtonClass}
        >
          Continue
        </Button>
      </div>
    </AuthShell>
  );
}
