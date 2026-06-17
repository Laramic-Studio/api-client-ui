/** Map step id → ids of directly connected downstream steps. */
export function buildOutgoingMap(steps, layout) {
  const outgoing = new Map(steps.map((s) => [s.id, []]));
  (layout?.edges || []).forEach((edge) => {
    if (!outgoing.has(edge.source) || !outgoing.has(edge.target)) return;
    outgoing.get(edge.source).push(edge.target);
  });
  return outgoing;
}

/**
 * Steps that should receive extraction passes from a completed step.
 * Uses canvas edges when present; otherwise falls back to the next sortOrder step.
 */
export function getPassTargets(sourceId, steps, layout, outgoing) {
  const children = outgoing.get(sourceId) || [];
  if (children.length) return children;
  if ((layout?.edges || []).length) return [];

  const ordered = [...steps].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const idx = ordered.findIndex((s) => s.id === sourceId);
  if (idx >= 0 && idx < ordered.length - 1) {
    return [ordered[idx + 1].id];
  }
  return [];
}

/** Topological execution order from canvas edges; falls back to sortOrder. */
export function getExecutionOrder(steps, layout) {
  const edges = layout?.edges || [];
  if (!steps.length) return [];
  if (!edges.length) {
    return [...steps].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  const byId = new Map(steps.map((s) => [s.id, s]));
  const incoming = new Map(steps.map((s) => [s.id, 0]));
  const outgoing = new Map(steps.map((s) => [s.id, []]));

  edges.forEach((edge) => {
    if (!byId.has(edge.source) || !byId.has(edge.target)) return;
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    outgoing.get(edge.source).push(edge.target);
  });

  const queue = steps
    .filter((s) => (incoming.get(s.id) || 0) === 0)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const ordered = [];
  const seen = new Set();

  while (queue.length) {
    const step = queue.shift();
    if (!step || seen.has(step.id)) continue;
    seen.add(step.id);
    ordered.push(step);
    (outgoing.get(step.id) || []).forEach((targetId) => {
      incoming.set(targetId, (incoming.get(targetId) || 0) - 1);
      if (incoming.get(targetId) === 0) {
        const next = byId.get(targetId);
        if (next) queue.push(next);
      }
    });
    queue.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  steps.forEach((s) => {
    if (!seen.has(s.id)) ordered.push(s);
  });

  return ordered;
}

/** Variable names declared on extractions across all steps (for URL autocomplete). */
export function collectConduitVarKeys(steps) {
  const keys = new Set();
  (steps || []).forEach((step) => {
    (step.extractions || []).forEach((ext) => {
      const name = ext.variable || (ext.path ? ext.path.replace(/\./g, "_") : "");
      if (name) keys.add(name);
    });
  });
  return [...keys];
}

export function defaultPosition(index) {
  return { x: 80 + index * 280, y: 120 };
}

export function createEmptyStep(index = 0) {
  return {
    name: "New step",
    method: "GET",
    url: "",
    params: [],
    headers: [],
    body: { type: "none", content: "" },
    auth: { type: "none" },
    extractions: [],
    condition: null,
    position: defaultPosition(index),
    sortOrder: index,
    requestId: null,
  };
}
