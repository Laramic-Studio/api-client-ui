const ACTIONS_BLOCK_RE = /```actions\s*\n([\s\S]*?)\n?```/gi;
const ACTIONS_BLOCK_PARSE_RE = /```actions\s*\n([\s\S]*?)\n?```/i;

export function stripActionsBlock(text) {
  if (!text) return "";
  let cleaned = String(text).replace(ACTIONS_BLOCK_RE, "").trim();
  // Strip markdown tables / doc content leaked after a broken actions fence
  cleaned = cleaned.replace(/\n?\[[\s\S]*?"type"\s*:\s*"builder\.[^[\]]*"[\s\S]*?\]\s*`{0,3}\s*$/i, "").trim();
  cleaned = cleaned.replace(/\n?"risk"\s*:\s*"(?:low|medium|high)"\s*\}\s*\]\s*`{0,3}\s*$/gi, "").trim();
  cleaned = cleaned.replace(/\n?```\s*$/g, "").trim();
  return cleaned;
}

/** Client-side fallback when the backend did not emit proposed_actions. */
export function parseProposedActionsFromText(full) {
  const text = String(full || "");
  const match = text.match(ACTIONS_BLOCK_PARSE_RE);

  if (match?.[1]) {
    try {
      const decoded = JSON.parse(match[1].trim());
      if (Array.isArray(decoded)) {
        return decoded.map((action, index) => {
          const type = String(action.type || "");
          let risk = String(action.risk || "low");
          if ([
            "builder.set_docs",
            "builder.document_from_response",
            "builder.send_request",
            "builder.summarize_response",
            "builder.apply_draft",
          ].includes(type)) {
            risk = "low";
          }
          return {
            id: action.id || `act-${index}-${type || "unknown"}`,
            type,
            label: String(action.label || "Run action"),
            description: action.description != null ? String(action.description) : null,
            payload: action.payload && typeof action.payload === "object" ? action.payload : {},
            risk,
          };
        });
      }
    } catch {
      const salvaged = salvageDocsActionFromText(text);
      if (salvaged.length) return salvaged;
    }
  }

  return salvageDocsActionFromText(text);
}

function summarizeProposedActions(proposedActions) {
  const lines = proposedActions.map((action) => {
    const detail = action.description ? ` — ${action.description}` : "";
    return `• ${action.label}${detail}`;
  });
  return `Running these actions:\n${lines.join("\n")}`;
}

/** Best-effort recovery when the model breaks JSON but intended builder.set_docs. */
function salvageDocsActionFromText(full) {
  const typeMatch = String(full || "").match(/"type"\s*:\s*"(builder\.set_docs)"/);
  if (!typeMatch) return [];

  const docsMatch = String(full).match(/"docs"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (!docsMatch) return [];

  try {
    const docs = JSON.parse(`"${docsMatch[1]}"`);
    return [{
      id: "act-salvaged-set-docs",
      type: "builder.set_docs",
      label: "Update documentation",
      description: null,
      payload: { docs },
      risk: "low",
    }];
  } catch {
    return [];
  }
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
