import { aiToolRegistry } from "@/ai-tools";

const NAV_ACTIONS = new Set([
  "nav.go",
  "conduit.open",
  "conduit.run",
  "builder.open_request",
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRoute() {
  return window.location.pathname;
}

/**
 * Auto-execute low-risk proposed actions in order (agentic navigation).
 * Stops on first failure. Waits briefly after navigation actions.
 */
export async function autoRunProposedActions(actions, { executeAction, navigate, appendMessage }) {
  if (!actions?.length) return { ran: 0, failed: false };

  const candidates = actions.filter((a) => a.risk === "low");
  if (!candidates.length) return { ran: 0, failed: false };

  let ran = 0;

  for (const action of candidates) {
    const route = getRoute();
    if (!aiToolRegistry.canExecute(action.type, route)) {
      appendMessage?.({
        role: "system",
        content: `Skipped ${action.label} — not ready on this page yet.`,
      });
      continue;
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

      if (NAV_ACTIONS.has(action.type)) {
        await sleep(350);
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
