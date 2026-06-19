import { registerAiAction } from "@/lib/ai/actions/registry";
import { findConduitMatch } from "@/lib/ai/catalog";
import { getClient } from "@/lib/api/client";
import { useAppStore } from "@/store/useAppStore";

registerAiAction("conduit.open", {
  label: "Open conduit",
  risk: "low",
  validate(payload) {
    if (!payload?.conduit_id && !payload?.name) {
      throw new Error("conduit_id or name is required.");
    }
  },
  async execute(payload, { navigate }) {
    const teamId = useAppStore.getState().activeWorkspaceId;
    if (!teamId) throw new Error("No active workspace.");

    const conduits = await getClient().listConduits();
    const conduit = findConduitMatch(conduits, payload);
    if (!conduit) {
      const hint = payload.name ? `"${payload.name}"` : payload.conduit_id;
      throw new Error(`Conduit ${hint} not found.`);
    }

    navigate(`/conduits/${conduit.id}`);
    return { ok: true, message: `Opened conduit "${conduit.name}".` };
  },
});
