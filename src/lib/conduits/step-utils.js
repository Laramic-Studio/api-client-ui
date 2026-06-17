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
