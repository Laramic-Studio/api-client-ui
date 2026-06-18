export function applyBuilderSpec(current, spec) {
  if (!spec || !current) return current;

  return {
    ...current,
    name: spec.name || current.name || "AI request",
    method: spec.method || current.method,
    url: spec.url ?? current.url,
    params: spec.params ?? current.params ?? [],
    headers: spec.headers ?? current.headers ?? [],
    auth: spec.auth ?? current.auth ?? { type: "none" },
    body: spec.body ?? current.body ?? { type: "none", content: "" },
    tests: spec.tests ?? current.tests ?? "",
    preScript: spec.preScript ?? current.preScript ?? "",
    docs: spec.docs ?? current.docs ?? "",
  };
}

export function builderSnapshot({ activeTabId, activeReq, isDirty, activeEnv }) {
  if (!activeReq) {
    return { hasOpenRequest: false };
  }

  return {
    hasOpenRequest: true,
    activeTabId,
    isScratch: activeTabId?.startsWith("scratch"),
    isDirty: Boolean(isDirty),
    name: activeReq.name,
    method: activeReq.method,
    url: activeReq.url,
    bodyType: activeReq.body?.type,
    collectionId: activeReq.collectionId,
    authType: activeReq.auth?.type,
    paramCount: (activeReq.params || []).filter((p) => p.key).length,
    headerCount: (activeReq.headers || []).filter((h) => h.key).length,
    activeEnvironment: activeEnv?.name || null,
  };
}
