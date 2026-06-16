import { createEmptyScratch, isScratchTab } from "@/lib/builder/scratch";

const TRACKED_FIELDS = [
  "name", "method", "url", "params", "headers", "auth", "body", "tests", "preScript", "docs",
];

function snapshot(req) {
  if (!req) return null;
  const out = {};
  for (const key of TRACKED_FIELDS) {
    out[key] = req[key];
  }
  return out;
}

export function isRequestDirty(saved, current) {
  if (!current) return false;
  if (!saved) return true;
  return JSON.stringify(snapshot(saved)) !== JSON.stringify(snapshot(current));
}

export function isScratchDirty(req) {
  if (!req?.id) return false;
  const empty = createEmptyScratch(req.id);
  return isRequestDirty(empty, req);
}

export function isTabDirty(tabId, draft, savedRequest) {
  if (draft) {
    if (isScratchTab(tabId)) return isScratchDirty(draft);
    return isRequestDirty(savedRequest, draft);
  }
  return false;
}
