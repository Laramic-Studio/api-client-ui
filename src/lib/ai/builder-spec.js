import {
  summarizeRequestForAi,
  summarizeResponseForAi,
  summarizeTestResultsForAi,
} from "@/lib/ai/snapshot";

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

export function builderSnapshot({
  activeTabId,
  activeReq,
  isDirty,
  activeEnv,
  openTabs,
  responses,
  testResults,
}) {
  const base = {
    openTabs: (openTabs || []).map((tab) => ({
      id: tab.id,
      label: tab.label,
      collectionId: tab.collectionId,
      isActive: tab.id === activeTabId,
    })),
  };

  if (!activeReq) {
    return { ...base, hasOpenRequest: false };
  }

  const response = activeTabId ? responses?.[activeTabId] : null;
  const tests = activeTabId ? testResults?.[activeTabId] : null;

  return {
    ...base,
    hasOpenRequest: true,
    activeTabId,
    isScratch: activeTabId?.startsWith("scratch"),
    isDirty: Boolean(isDirty),
    activeEnvironment: activeEnv?.name || null,
    request: summarizeRequestForAi(activeReq),
    lastResponse: summarizeResponseForAi(response),
    testResults: summarizeTestResultsForAi(tests),
  };
}
