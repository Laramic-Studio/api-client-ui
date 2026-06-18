import { registerAiAction } from "@/lib/ai/actions/registry";
import * as environmentsApi from "@/lib/api/environments-api";
import { refreshEnvironmentsInStore } from "@/hooks/use-environments";
import { useAppStore } from "@/store/useAppStore";

registerAiAction("env.create", {
  label: "Create environment",
  risk: "medium",
  validate(payload) {
    if (!payload?.name || typeof payload.name !== "string") {
      throw new Error("Environment name is required.");
    }
  },
  async execute(payload) {
    const teamId = useAppStore.getState().activeWorkspaceId;
    if (!teamId) throw new Error("No active workspace.");

    const data = await environmentsApi.createEnvironment(teamId, {
      name: payload.name,
      collection_id: payload.collection_id ?? null,
      variables: payload.variables ?? [],
    });
    await refreshEnvironmentsInStore(teamId);

    return { ok: true, message: `Created environment "${data.environment.name}".` };
  },
});

registerAiAction("env.update_variables", {
  label: "Update environment variables",
  risk: "medium",
  validate(payload) {
    if (!payload?.environment_id) throw new Error("environment_id is required.");
    if (!Array.isArray(payload.variables)) throw new Error("variables array is required.");
  },
  async execute(payload) {
    const teamId = useAppStore.getState().activeWorkspaceId;
    if (!teamId) throw new Error("No active workspace.");

    await environmentsApi.updateEnvironment(teamId, payload.environment_id, {
      variables: payload.variables,
    });
    useAppStore.getState().updateEnvironment(payload.environment_id, {
      variables: payload.variables,
    });

    return { ok: true, message: "Environment variables updated." };
  },
});
