import { findConduitMatch } from "@/lib/ai/catalog";
import { getClient } from "@/lib/api/client";
import { runConduit } from "@/lib/conduits/executor";
import { useAppStore } from "@/store/useAppStore";

export async function resolveConduit(payload) {
  const conduits = await getClient().listConduits();
  const conduit = findConduitMatch(conduits, payload);
  if (!conduit) {
    const hint = payload.name ? `"${payload.name}"` : payload.conduit_id;
    throw new Error(`Conduit ${hint} not found.`);
  }
  return conduit;
}

/** Match step ids by explicit id or partial name/url match. */
export function matchStepIds(steps, { ids = [], names = [] } = {}) {
  const matched = new Set();
  (ids || []).forEach((id) => {
    if (steps.some((s) => s.id === id)) matched.add(id);
  });
  (names || []).forEach((name) => {
    const q = String(name).toLowerCase().trim();
    if (!q) return;
    steps.forEach((s) => {
      const label = `${s.name || ""} ${s.url || ""}`.toLowerCase();
      if (label.includes(q)) matched.add(s.id);
    });
  });
  return matched;
}

export function prepareConduitForRun(conduit, payload) {
  const steps = conduit.steps || [];
  const disconnectIds = matchStepIds(steps, {
    ids: payload.disconnect_step_ids,
    names: payload.disconnect_step_names,
  });
  const excludeIds = matchStepIds(steps, {
    ids: payload.exclude_step_ids,
    names: payload.exclude_step_names,
  });

  // Disconnecting a step also skips it from this run unless exclude_disconnected is false
  const skipIds = new Set([...excludeIds]);
  if (payload.exclude_disconnected !== false) {
    disconnectIds.forEach((id) => skipIds.add(id));
  }

  let edges = [...(conduit.layout?.edges || [])];
  if (disconnectIds.size) {
    edges = edges.filter((e) => !disconnectIds.has(e.source) && !disconnectIds.has(e.target));
  }

  const runSteps = steps.filter((s) => !skipIds.has(s.id));
  const skippedNames = steps.filter((s) => skipIds.has(s.id)).map((s) => s.name);

  return {
    runSteps,
    layout: { edges },
    skippedNames,
    disconnectIds,
    persistedLayout: disconnectIds.size ? { edges } : null,
  };
}

export function summarizeConduitRunResult(result, conduitName, { skippedNames = [] } = {}) {
  const stepLines = (result.steps || []).map((step) => {
    if (step.skipped) return `• ${step.name}: skipped (${step.error || "condition"})`;
    const bodyPreview = step.responseBody != null
      ? JSON.stringify(step.responseBody).slice(0, 120)
      : "";
    return `• ${step.name}: ${step.status ?? "—"} (${step.durationMs ?? 0}ms)${bodyPreview ? ` — ${bodyPreview}` : ""}`;
  });

  return [
    result.success ? `Conduit "${conduitName}" completed.` : `Conduit "${conduitName}" stopped early.`,
    skippedNames.length ? `Skipped: ${skippedNames.join(", ")}` : null,
    ...stepLines,
    result.variables && Object.keys(result.variables).length
      ? `Variables: ${JSON.stringify(result.variables)}`
      : null,
  ].filter(Boolean).join("\n");
}

export async function executeConduitRun(payload, { navigate }) {
  const teamId = useAppStore.getState().activeWorkspaceId;
  if (!teamId) throw new Error("No active workspace.");

  const conduit = await resolveConduit(payload);
  const prepared = prepareConduitForRun(conduit, payload);

  if (!prepared.runSteps.length) {
    throw new Error("No steps left to run after exclusions.");
  }

  if (payload.persist_disconnect && prepared.persistedLayout) {
    await getClient().updateConduit(conduit.id, { layout: prepared.persistedLayout });
  }

  const env = useAppStore.getState().getActiveEnvironment();
  const result = await runConduit({
    steps: prepared.runSteps,
    layout: prepared.layout,
    env,
    mode: "real",
  });

  useAppStore.getState().setAiConduitRunResult({ conduitId: conduit.id, result });
  navigate(`/conduits/${conduit.id}`);

  return {
    ok: result.success,
    message: summarizeConduitRunResult(result, conduit.name, {
      skippedNames: prepared.skippedNames,
    }),
    data: { conduitId: conduit.id, result },
  };
}
