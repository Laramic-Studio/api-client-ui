export function stripActionsBlock(text) {
  if (!text) return text;
  return text.replace(/```actions\s*\n[\s\S]*?\n```/gi, "").trim();
}
