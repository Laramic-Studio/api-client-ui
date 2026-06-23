import { isScratchTab } from "@/lib/builder/scratch";
import { useAppStore } from "@/store/useAppStore";

/** Match a step by exact id or partial name (case-insensitive). */
export function resolveStepRef(conduit, ref) {
  if (!ref || !conduit?.steps?.length) return null;
  const needle = String(ref).trim().toLowerCase();
  if (!needle) return null;

  const exactId = conduit.steps.find((s) => s.id === ref);
  if (exactId) return exactId;

  const exactName = conduit.steps.find((s) => String(s.name || "").toLowerCase() === needle);
  if (exactName) return exactName;

  const partial = conduit.steps.filter((s) => String(s.name || "").toLowerCase().includes(needle));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    throw new Error(`Multiple steps match "${ref}": ${partial.map((s) => s.name).join(", ")}. Be more specific.`);
  }

  return null;
}

export function requireStepRef(conduit, ref, label = "step") {
  const step = resolveStepRef(conduit, ref);
  if (!step) throw new Error(`${label} "${ref}" not found on this conduit.`);
  return step;
}

/** Open request from API builder tab (works even when user is on the conduit page). */
export function resolveBuilderOpenRequest() {
  const state = useAppStore.getState();
  const tabId = state.activeTabId;
  if (!tabId || isScratchTab(tabId)) return null;

  const draft = state.builderSession?.drafts?.[tabId];
  if (draft) return draft;

  const found = state.findRequest(tabId);
  return found?.request || null;
}

function upsertKvRow(rows, key, value) {
  const list = [...(rows || [])];
  const idx = list.findIndex((row) => String(row.key || "").toLowerCase() === String(key).toLowerCase());
  const next = {
    ...(idx >= 0 ? list[idx] : {}),
    key,
    value: String(value),
    enabled: true,
  };
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  return list;
}

/** Apply AI-friendly patch helpers onto a conduit step. */
export function applyConduitStepPatch(step, patch) {
  if (!patch || typeof patch !== "object") return step;

  const next = { ...step };
  const {
    set_param: setParam,
    set_header: setHeader,
    set_body_field: setBodyField,
    ...rest
  } = patch;

  if (setParam?.key != null) {
    next.params = upsertKvRow(next.params, setParam.key, setParam.value ?? "");
  }

  if (setHeader?.key != null) {
    next.headers = upsertKvRow(next.headers, setHeader.key, setHeader.value ?? "");
  }

  if (setBodyField?.key != null && next.body?.type === "json") {
    try {
      const parsed = JSON.parse(next.body.content || "{}");
      parsed[setBodyField.key] = setBodyField.value;
      next.body = { ...next.body, content: JSON.stringify(parsed, null, 2) };
    } catch {
      throw new Error("Step body is not valid JSON — set body content first.");
    }
  }

  return { ...next, ...rest };
}

export function connectStepsOnConduit(conduit, sourceId, targetId, connectFn, patchConduit) {
  const edges = conduit.layout?.edges || [];
  if (edges.some((e) => e.source === sourceId && e.target === targetId)) {
    return false;
  }

  if (connectFn) {
    connectFn(sourceId, targetId);
  } else {
    patchConduit(conduit.id, {
      layout: { edges: [...edges, { id: crypto.randomUUID(), source: sourceId, target: targetId }] },
    });
  }
  return true;
}
