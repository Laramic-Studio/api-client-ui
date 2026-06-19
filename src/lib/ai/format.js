const ACTIONS_BLOCK_RE = /```actions\s*\n([\s\S]*?)\n?```/gi;
const ACTIONS_BLOCK_PARSE_RE = /```actions\s*\n([\s\S]*?)\n?```/i;

export function stripActionsBlock(text) {
  if (!text) return "";
  return text.replace(ACTIONS_BLOCK_RE, "").trim();
}

/** Client-side fallback when the backend did not emit proposed_actions. */
export function parseProposedActionsFromText(full) {
  const match = String(full || "").match(ACTIONS_BLOCK_PARSE_RE);
  if (!match?.[1]) return [];

  let decoded;
  try {
    decoded = JSON.parse(match[1].trim());
  } catch {
    return [];
  }
  if (!Array.isArray(decoded)) return [];

  return decoded.map((action, index) => ({
    id: action.id || `act-${index}-${action.type || "unknown"}`,
    type: String(action.type || ""),
    label: String(action.label || "Run action"),
    description: action.description != null ? String(action.description) : null,
    payload: action.payload && typeof action.payload === "object" ? action.payload : {},
    risk: String(action.risk || "low"),
  }));
}

function summarizeProposedActions(proposedActions) {
  const lines = proposedActions.map((action) => {
    const detail = action.description ? ` — ${action.description}` : "";
    return `• ${action.label}${detail}`;
  });
  return `Running these actions:\n${lines.join("\n")}`;
}

/**
 * Ensure the assistant bubble is never empty when the model only returned an actions block.
 */
export function finalizeAssistantContent(full, proposedActions = []) {
  const text = stripActionsBlock(full || "");
  if (text) return text;

  if (proposedActions.length > 0) {
    return summarizeProposedActions(proposedActions);
  }

  return "Done.";
}
