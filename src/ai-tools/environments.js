import { defineAction, defineTool } from "@/ai-tools/types";
import * as environmentsApi from "@/lib/api/environments-api";
import { refreshEnvironmentsInStore } from "@/hooks/use-environments";
import { useAppStore } from "@/store/useAppStore";

export const environmentsTool = defineTool({
  id: "environments",
  scope: "page",
  pageId: "environments",
  description: "Environments — manage variables and scopes",
  actions: {
    "env.create": defineAction({
      label: "Create environment",
      description: "Create a new environment with optional variables",
      risk: "medium",
      payloadHint: '{"name":"Production","collection_id":null,"variables":[{"key":"BASE_URL","value":"https://api.example.com","enabled":true}]}',
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
    }),
    "env.update_variables": defineAction({
      label: "Update environment variables",
      description: "Replace variables on an environment",
      risk: "medium",
      payloadHint: '{"environment_id":"<uuid>","variables":[{"key":"X","value":"y","enabled":true}]}',
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
    }),
  },
});
