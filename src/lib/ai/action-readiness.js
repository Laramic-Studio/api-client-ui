import { resolveAiPageId } from "@/lib/ai/pages";
import { isScratchTab } from "@/lib/builder/scratch";
import { useAppStore } from "@/store/useAppStore";
import { aiToolRegistry } from "@/ai-tools";

export const DEFAULT_ACTION_WAIT = { timeoutMs: 12_000, intervalMs: 50 };

export function pageLabel(pageId) {
  if (!pageId) return "page";
  return pageId.replace(/-/g, " ");
}

/** Default route to open when a page-scoped action needs its bindings. */
export function resolvePageRoute(pageId) {
  if (!pageId) return null;
  if (pageId === "api-builder") {
    const tabId = useAppStore.getState().activeTabId;
    if (tabId && !isScratchTab(tabId)) return `/builder/${tabId}`;
    return "/builder";
  }
  const staticRoutes = {
    conduits: "/conduits",
    environments: "/environments",
    collections: "/collections",
    settings: "/settings",
    team: "/team",
    workspaces: "/workspaces",
  };
  return staticRoutes[pageId] || null;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getRoute() {
  return window.location.pathname;
}

/** Does the current route match a navigation target (exact or nested path). */
export function routeMatchesTarget(currentPath, targetPath) {
  if (!targetPath) return true;
  const current = String(currentPath || "").split("?")[0].replace(/\/$/, "") || "/";
  const target = String(targetPath || "").split("?")[0].replace(/\/$/, "") || "/";
  if (current === target) return true;
  return current.startsWith(`${target}/`);
}

/**
 * Poll until window.location matches a target path prefix.
 * @param {string} targetPath
 * @param {{ timeoutMs?: number, intervalMs?: number, getRoute?: () => string }} [options]
 */
export async function waitForRouteMatch(targetPath, options = {}) {
  const {
    timeoutMs = 10_000,
    intervalMs = 50,
    getRoute: getRouteFn = getRoute,
  } = options;

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (routeMatchesTarget(getRouteFn(), targetPath)) {
      return { matched: true, route: getRouteFn() };
    }
    await sleep(intervalMs);
  }

  return { matched: false, route: getRouteFn() };
}

/**
 * Resolve the post-navigation route for actions that change pages.
 * Extend this map when adding new global navigation actions.
 */
export const NAVIGATION_TARGET_RESOLVERS = {
  "nav.go": (payload) => payload?.path,
  "builder.open_request": () => "/builder",
  "conduit.open": () => "/conduits",
  "conduit.run": () => "/conduits",
};

export function resolvesNavigationTarget(actionType, payload = {}) {
  const resolver = NAVIGATION_TARGET_RESOLVERS[actionType];
  return resolver ? resolver(payload) : null;
}

export function isNavigationAction(actionType) {
  return actionType in NAVIGATION_TARGET_RESOLVERS;
}

/**
 * After a navigation action, wait for the URL and target page id (if any).
 */
export async function waitForNavigationTarget(actionType, payload, options = {}) {
  const targetPath = resolvesNavigationTarget(actionType, payload);
  if (!targetPath) return { ok: true, route: getRoute(), pageId: null };

  const { matched, route } = await waitForRouteMatch(targetPath, options);
  const pageId = resolveAiPageId(targetPath);

  return { ok: matched, route, pageId, targetPath };
}

/**
 * Navigate (if needed) and wait until an action can execute.
 * Used by auto-run and manual action approval.
 */
export async function ensureActionReady(
  type,
  {
    navigate,
    appendMessage,
    getRoute: getRouteFn = getRoute,
    ...waitOptions
  } = {},
) {
  const waitOpts = { ...DEFAULT_ACTION_WAIT, ...waitOptions, getRoute: getRouteFn };
  let route = getRouteFn();

  if (aiToolRegistry.canExecute(type, route)) {
    return { ready: true, route };
  }

  const meta = aiToolRegistry.getActionMeta(type);
  const pageId = meta?.pageId;
  const targetPath = pageId ? resolvePageRoute(pageId) : null;

  if (pageId && targetPath && !routeMatchesTarget(route, targetPath)) {
    appendMessage?.({
      role: "system",
      content: `Opening ${pageLabel(pageId)}…`,
    });
    navigate?.(targetPath);
    await waitForRouteMatch(targetPath, waitOpts);
    await aiToolRegistry.waitForPageReady(pageId, waitOpts);
    route = getRouteFn();
  }

  if (aiToolRegistry.canExecute(type, route)) {
    return { ready: true, route };
  }

  if (meta?.scope === "page" || meta?.requiresBinding) {
    appendMessage?.({
      role: "system",
      content: `Waiting for ${pageLabel(pageId)} to load…`,
    });
  }

  const wait = await aiToolRegistry.waitForActionReady(type, waitOpts);
  return { ready: wait.ready, route: wait.route || route };
}
