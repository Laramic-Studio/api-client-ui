import { api } from "@/lib/api/http";

export async function completeOnboarding(payload) {
  const form = new FormData();
  form.append("account_type", payload.accountType);

  if (payload.workspaceName) {
    form.append("workspace_name", payload.workspaceName);
  }

  if (payload.organisationName) {
    form.append("organisation_name", payload.organisationName);
  }

  if (payload.teamSize) {
    form.append("team_size", payload.teamSize);
  }

  if (payload.logoFile) {
    form.append("logo", payload.logoFile);
  }

  (payload.invites || []).forEach((invite, index) => {
    form.append(`invites[${index}][email]`, invite.email);
    if (invite.role) {
      form.append(`invites[${index}][role]`, invite.role);
    }
  });

  const { data } = await api.post("/onboarding/complete", form);

  return data;
}
