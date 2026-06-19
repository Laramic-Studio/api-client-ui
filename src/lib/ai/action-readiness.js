import { resolveAiPageId } from "@/lib/ai/pages";

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
 * Generic poll helper.
 */
export async function pollUntil(check, { timeoutMs = 10_000, intervalMs = 50 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await check();
    if (value) return value;
    await sleep(intervalMs);
  }
  return null;
}
