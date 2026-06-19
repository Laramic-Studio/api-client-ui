import { aiToolRegistry } from "@/ai-tools";
import {
  DEFAULT_ACTION_WAIT,
  ensureActionReady,
  getRoute,
  isNavigationAction,
  pageLabel,
  waitForNavigationTarget,
} from "@/lib/ai/action-readiness";

const ENRICH_ASSISTANT_ACTIONS = new Set([
  "builder.send_request",
  "builder.send_request_via_cloud",
  "builder.summarize_response",
]);

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
  if (!actions?.length) {
    return { ran: 0, failed: false, enrichments: [], completedIds: [], skippedIds: [] };
  }

  const candidates = prioritizeActionChain(actions.filter((a) => a.risk === "low"));
  if (!candidates.length) {
    return { ran: 0, failed: false, enrichments: [], completedIds: [], skippedIds: [] };
  }

  let ran = 0;
  /** @type {string[]} */
  const enrichments = [];
  /** @type {string[]} */
  const completedIds = [];
  /** @type {string[]} */
  const skippedIds = [];

  for (const action of candidates) {
    const ready = await ensureActionReady(action.type, {
      navigate,
      appendMessage,
      getRoute,
      ...DEFAULT_ACTION_WAIT,
    });

    if (!ready.ready) {
      skippedIds.push(action.id);
      appendMessage?.({
        role: "system",
        content: `Skipped ${action.label} — ${pageLabel(aiToolRegistry.getActionMeta(action.type)?.pageId)} did not become ready in time.`,
      });
      continue;
    }

    try {
      const result = await executeAction(action.type, action.payload || {}, {
        navigate,
        route: ready.route,
      });
      ran += 1;
      completedIds.push(action.id);

      const enrich = result?.enrichAssistant && result?.message
        ? result.message
        : ENRICH_ASSISTANT_ACTIONS.has(action.type) && result?.message
          ? result.message
          : null;

      if (enrich) {
        enrichments.push(enrich);
        appendMessage?.({
          role: "system",
          content: `${action.label} completed.`,
        });
      } else {
        appendMessage?.({
          role: "system",
          content: result?.message || `${action.label} completed.`,
        });
      }

      if (isNavigationAction(action.type)) {
        const nav = await waitForNavigationTarget(action.type, action.payload || {}, DEFAULT_ACTION_WAIT);
        if (nav.pageId) {
          const page = await aiToolRegistry.waitForPageReady(nav.pageId, DEFAULT_ACTION_WAIT);
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
      skippedIds.push(action.id);
      appendMessage?.({
        role: "system",
        content: err.message || `${action.label} failed.`,
      });
      return { ran, failed: true, enrichments, completedIds, skippedIds };
    }
  }

  return { ran, failed: false, enrichments, completedIds, skippedIds };
}

/** Manual approval path — same readiness logic as auto-run. */
export async function runApprovedAction(action, { executeAction, navigate, appendMessage }) {
  const ready = await ensureActionReady(action.type, {
    navigate,
    appendMessage,
    getRoute,
    ...DEFAULT_ACTION_WAIT,
  });

  if (!ready.ready) {
    throw new Error(
      `Action "${action.type}" is not ready — open ${pageLabel(aiToolRegistry.getActionMeta(action.type)?.pageId)} and try again.`,
    );
  }

  return executeAction(action.type, action.payload || {}, {
    navigate,
    route: ready.route,
  });
}
