import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { buildAiContextBundle } from "@/lib/ai/context";
import { readCachedConduits } from "@/lib/ai/catalog";
import { resolveAiPageId } from "@/lib/ai/pages";
import { summarizeCollectionsForAi } from "@/lib/ai/snapshot";

const AiContext = createContext(null);

export function AiContextProvider({ children }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const workspaces = useAppStore((s) => s.workspaces);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const currentTeam = useAppStore((s) => s.currentTeam);
  const aiPageContext = useAppStore((s) => s.aiPageContext);
  const setAiPageContext = useAppStore((s) => s.setAiPageContext);
  const pageRegistrations = useRef(new Map());

  const registerPage = useCallback((pageId, { getSnapshot, getActionHandler } = {}) => {
    pageRegistrations.current.set(pageId, { getSnapshot, getActionHandler });
    return () => pageRegistrations.current.delete(pageId);
  }, []);

  const getActiveRegistration = useCallback(() => {
    const pageId = resolveAiPageId(location.pathname);
    if (!pageId) return null;
    return pageRegistrations.current.get(pageId) || null;
  }, [location.pathname]);

  const executePageAction = useCallback(async (type, payload, ctx) => {
    const reg = getActiveRegistration();
    const handler = reg?.getActionHandler?.(type);
    if (!handler) {
      throw new Error(`Action "${type}" is not available on this page.`);
    }
    return handler(payload, ctx);
  }, [getActiveRegistration]);

  useEffect(() => {
    setAiPageContext(null);
  }, [location.pathname, setAiPageContext]);

  const getContextBundle = useCallback(() => {
    const workspace = workspaces.find((w) => w.id === activeWorkspaceId) || null;
    let page = aiPageContext;

    if (!page) {
      const pageId = resolveAiPageId(location.pathname);
      const reg = pageId ? pageRegistrations.current.get(pageId) : null;
      if (reg) {
        page = {
          pageId,
          snapshot: reg.getSnapshot?.() ?? null,
        };
      }
    }

    const collections = useAppStore.getState().collectionsMap[activeWorkspaceId] || [];

    return buildAiContextBundle({
      route: location.pathname,
      user,
      workspace,
      team: currentTeam,
      pageContext: page,
      catalog: {
        collections: summarizeCollectionsForAi(collections),
        conduits: readCachedConduits(queryClient, activeWorkspaceId),
      },
    });
  }, [location.pathname, user, workspaces, activeWorkspaceId, currentTeam, aiPageContext, queryClient]);

  const value = useMemo(
    () => ({ getContextBundle, registerPage, executePageAction }),
    [getContextBundle, registerPage, executePageAction],
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

export function useAiContext() {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error("useAiContext must be used within AiContextProvider");
  return ctx;
}

export function useRegisterAiPage(pageId, config) {
  const { registerPage } = useAiContext();
  const getSnapshotRef = useRef(config.getSnapshot);
  const actionHandlersRef = useRef(config.actionHandlers || {});

  getSnapshotRef.current = config.getSnapshot;
  actionHandlersRef.current = config.actionHandlers || {};

  useEffect(() => {
    return registerPage(pageId, {
      getSnapshot: () => getSnapshotRef.current?.(),
      getActionHandler: (type) => actionHandlersRef.current?.[type] || null,
    });
  }, [pageId, registerPage]);
}
