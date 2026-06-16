import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import AccountTypePicker from "@/components/onboarding/AccountTypePicker";
import CompanyDetailsForm from "@/components/onboarding/CompanyDetailsForm";
import WorkspaceNotice from "@/components/onboarding/WorkspaceNotice";
import { TEAM_SIZES } from "@/components/onboarding/constants";
import { toast } from "sonner";

export default function Onboarding() {
  const currentTeam = useAppStore((s) => s.currentTeam);
  const complete = useAppStore((s) => s.completeOnboarding);

  const [type, setType] = useState("individual");
  const [companyName, setCompanyName] = useState("");
  const [size, setSize] = useState(TEAM_SIZES[1]);
  const [logo, setLogo] = useState(null);

  const submit = () => {
    if (type === "company" && !companyName.trim()) {
      toast.error("Add a company name");
      return;
    }

    const company = type === "company"
      ? { name: companyName.trim(), size, logo }
      : null;

    complete({ accountType: type, company });
    toast.success("All set — welcome to Noidr");
  };

  const personalTeamName = currentTeam?.name || currentTeam?.slug;

  return (
    <AuthShell
      title="Tell us about yourself"
      subtitle="This personalizes your workspace and branding."
    >
      <div className="space-y-5">
        <WorkspaceNotice
          teamName={personalTeamName}
          showCompanyNote={type === "company"}
        />

        <AccountTypePicker value={type} onChange={setType} />

        {type === "company" && (
          <CompanyDetailsForm
            companyName={companyName}
            size={size}
            logo={logo}
            onChange={(patch) => {
              if ("companyName" in patch) setCompanyName(patch.companyName);
              if ("size" in patch) setSize(patch.size);
              if ("logo" in patch) setLogo(patch.logo);
            }}
          />
        )}

        <Button
          onClick={submit}
          data-testid="onboarding-submit"
          className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white font-medium"
        >
          Finish setup
        </Button>
      </div>
    </AuthShell>
  );
}
