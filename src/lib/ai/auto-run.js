import { aiToolRegistry } from "@/ai-tools";
import {
  getRoute,
  isNavigationAction,
  waitForNavigationTarget,
} from "@/lib/ai/action-readiness";

const DEFAULT_WAIT = { timeoutMs: 12_000, intervalMs: 50 };

function pageLabel(pageId) {
  if (!pageId) return "page";
  return pageId.replace(/-/g, " ");
}

/** Navigation actions run first so page bindings can load before page-scoped steps. */
function prioritizeActionChain(actions) {
  const navigation = [];
  const rest = [];
  for (const action of actions) {
    if (isNavigationAction(action.type)) navigation.push(action);
    else rest.push(action);
  }
  return [...navigation, ...rest];
}

/**
 * Auto-execute low-risk proposed actions in order (agentic navigation).
 * Waits for routes and page bindings so cross-page chains work in one turn.
 */
export async function autoRunProposedActions(actions, { executeAction, navigate, appendMessage }) {
  if (!actions?.length) return { ran: 0, failed: false };

  const candidates = prioritizeActionChain(actions.filter((a) => a.risk === "low"));
  if (!candidates.length) return { ran: 0, failed: false };

  let ran = 0;

  for (const action of candidates) {
    const meta = aiToolRegistry.getActionMeta(action.type);
    let route = getRoute();

    if (!aiToolRegistry.canExecute(action.type, route)) {
      const canWait = meta?.scope === "page" || meta?.requiresBinding;

      if (canWait) {
        appendMessage?.({
          role: "system",
          content: `Waiting for ${pageLabel(meta?.pageId)} to load…`,
        });

        const wait = await aiToolRegistry.waitForActionReady(action.type, {
          ...DEFAULT_WAIT,
          getRoute,
        });

        if (!wait.ready) {
          appendMessage?.({
            role: "system",
            content: `Skipped ${action.label} — ${pageLabel(meta?.pageId)} did not become ready in time.`,
          });
          continue;
        }

        route = wait.route;
      } else {
        appendMessage?.({
          role: "system",
          content: `Skipped ${action.label} — not available right now.`,
        });
        continue;
      }
    }

    try {
      const result = await executeAction(action.type, action.payload || {}, {
        navigate,
        route,
      });
      ran += 1;
      appendMessage?.({
        role: "system",
        content: result?.message || `${action.label} completed.`,
      });

      if (isNavigationAction(action.type)) {
        const nav = await waitForNavigationTarget(action.type, action.payload || {}, DEFAULT_WAIT);
        if (nav.pageId) {
          const page = await aiToolRegistry.waitForPageReady(nav.pageId, DEFAULT_WAIT);
          if (!page.ready) {
            appendMessage?.({
              role: "system",
              content: `Navigation done, but ${pageLabel(nav.pageId)} bindings were slow to load.`,
            });
          }
        } else if (!nav.ok) {
          appendMessage?.({
            role: "system",
            content: `Navigation may not have completed (expected ${nav.targetPath}).`,
          });
        }
      }
    } catch (err) {
      appendMessage?.({
        role: "system",
        content: err.message || `${action.label} failed.`,
      });
      return { ran, failed: true };
    }
  }

  return { ran, failed: false };
}
