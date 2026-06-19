export function stripActionsBlock(text) {
  if (!text) return "";
  return text.replace(/```actions\s*\n[\s\S]*?\n```/gi, "").trim();
}

/**
 * Ensure the assistant bubble is never empty when the model only returned an actions block.
 */
export function finalizeAssistantContent(full, proposedActions = []) {
  const text = stripActionsBlock(full || "");
  if (text) return text;

  if (proposedActions.length > 0) {
    const lines = proposedActions.map((action) => {
      const detail = action.description ? ` — ${action.description}` : "";
      return `• ${action.label}${detail}`;
    });
    return `Running these actions:\n${lines.join("\n")}`;
  }

  const trimmed = String(full || "").trim();
  return trimmed || "Done.";
}
