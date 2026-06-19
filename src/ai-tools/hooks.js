import { useEffect, useRef } from "react";
import { aiToolRegistry } from "@/ai-tools/registry";

/**
 * Bind a page's live snapshot + runtime action executors to the AI tool registry.
 *
 * @param {string} pageId - Must match the tool's pageId (see ai-tools/*.js)
 * @param {{
 *   getSnapshot?: () => Record<string, unknown>|null,
 *   bindings?: Record<string, (payload: Record<string, unknown>, ctx: import('@/ai-tools/types').AiActionContext) => unknown>,
 * }} config
 */
export function useBindAiTool(pageId, config) {
  const snapshotRef = useRef(config.getSnapshot);
  const bindingsRef = useRef(config.bindings || {});

  snapshotRef.current = config.getSnapshot;
  bindingsRef.current = config.bindings || {};

  useEffect(() => {
    return aiToolRegistry.bindPage(pageId, {
      getSnapshot: () => snapshotRef.current?.() ?? null,
      getBinding: (type) => bindingsRef.current[type] || null,
    });
  }, [pageId]);
}

/** @deprecated Use useBindAiTool */
export const useRegisterAiPage = useBindAiTool;
