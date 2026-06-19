import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { aiToolRegistry } from "@/ai-tools";
import { readCachedConduits } from "@/lib/ai/catalog";
import { buildAiContextBundle } from "@/lib/ai/context";
import { summarizeCollectionsForAi } from "@/lib/ai/snapshot";
import { useAppStore } from "@/store/useAppStore";

const AiContext = createContext(null);

export function AiContextProvider({ children }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const workspaces = useAppStore((s) => s.workspaces);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const currentTeam = useAppStore((s) => s.currentTeam);
  const setAiPageContext = useAppStore((s) => s.setAiPageContext);

  useEffect(() => {
    setAiPageContext(null);
  }, [location.pathname, setAiPageContext]);

  const getContextBundle = useCallback(() => {
    const route = location.pathname;
    const pageId = aiToolRegistry.resolvePageId(route);
    const workspace = workspaces.find((w) => w.id === activeWorkspaceId) || null;
    const collections = useAppStore.getState().collectionsMap[activeWorkspaceId] || [];

    return buildAiContextBundle({
      route,
      pageId,
      user,
      workspace,
      team: currentTeam,
      layout: aiToolRegistry.getGlobalSnapshots(route),
      pageContext: pageId
        ? { pageId, snapshot: aiToolRegistry.getPageSnapshot(route) }
        : null,
      catalog: {
        collections: summarizeCollectionsForAi(collections),
        conduits: readCachedConduits(queryClient, activeWorkspaceId),
      },
      availableTools: aiToolRegistry.getManifest(route),
    });
  }, [location.pathname, user, workspaces, activeWorkspaceId, currentTeam, queryClient]);

  const executeAction = useCallback(async (type, payload, ctx) => {
    return aiToolRegistry.execute(type, payload, ctx);
  }, []);

  const value = useMemo(
    () => ({ getContextBundle, executeAction }),
    [getContextBundle, executeAction],
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

export function useAiContext() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error("useAiContext must be used within AiContextProvider");
  return ctx;
}

export { useBindAiTool, useRegisterAiPage } from "@/ai-tools/hooks";
