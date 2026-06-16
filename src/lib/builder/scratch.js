export function isScratchTab(tabId) {
  return tabId === "scratch" || (typeof tabId === "string" && tabId.startsWith("scratch-"));
}

export function createScratchTabId() {
  return `scratch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyScratch(tabId) {
  return {
    id: tabId,
    name: "Untitled request",
    method: "GET",
    url: "",
    params: [],
    headers: [],
    auth: { type: "none" },
    body: { type: "none", content: "" },
    tests: "",
    preScript: "",
    docs: "",
    examples: [],
    starred: false,
    collectionId: null,
  };
}
