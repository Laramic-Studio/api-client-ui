import { defineTool } from "@/ai-tools/types";

/** Snapshot-only tool — actions can be added as the Collections page grows. */
export const collectionsTool = defineTool({
  id: "collections",
  scope: "page",
  pageId: "collections",
  description: "Collections — browse and organize saved requests",
  actions: {},
});
