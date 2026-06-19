import { aiToolRegistry } from "@/ai-tools/registry";
import { layoutTool } from "@/ai-tools/layout";
import { catalogTool } from "@/ai-tools/catalog";
import { apiBuilderTool } from "@/ai-tools/api-builder";
import { conduitsTool } from "@/ai-tools/conduits";
import { environmentsTool } from "@/ai-tools/environments";
import { collectionsTool } from "@/ai-tools/collections";

const TOOLS = [
  layoutTool,
  catalogTool,
  apiBuilderTool,
  conduitsTool,
  environmentsTool,
  collectionsTool,
];

for (const tool of TOOLS) {
  aiToolRegistry.registerTool(tool);
}

export { aiToolRegistry } from "@/ai-tools/registry";
export { useBindAiTool, useRegisterAiPage } from "@/ai-tools/hooks";
export { layoutTool, catalogTool, apiBuilderTool, conduitsTool, environmentsTool, collectionsTool };
