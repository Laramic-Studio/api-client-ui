const DEFAULT_MAX_HISTORY_MESSAGES = 24;

/**
 * Build LLM message history — excludes system messages and caps length.
 * @param {Array<{ role: string, content?: string }>} messages
 * @param {{ maxMessages?: number, pendingUser?: string }} [options]
 */
export function buildChatHistoryForModel(messages, { maxMessages = DEFAULT_MAX_HISTORY_MESSAGES, pendingUser } = {}) {
  const eligible = (messages || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .filter((m) => String(m.content || "").trim())
    .map((m) => ({ role: m.role, content: m.content }));

  const capped = eligible.length > maxMessages
    ? eligible.slice(-maxMessages)
    : eligible;

  if (pendingUser?.trim()) {
    return [...capped, { role: "user", content: pendingUser.trim() }];
  }

  return capped;
}

export function buildAiContextBundle({
  route,
  pageId,
  user,
  workspace,
  team,
  layout,
  pageContext,
  catalog,
  availableTools,
}) {
  return {
    route: route || "/",
    pageId: pageId || null,
    timestamp: new Date().toISOString(),
    user: user
      ? { id: user.id, name: user.name, email: user.email }
      : null,
    workspace: workspace
      ? { id: workspace.id, name: workspace.name }
      : null,
    team: team
      ? { id: team.id, name: team.name, role: team.role }
      : null,
    layout: layout || null,
    catalog: catalog || null,
    page: pageContext || null,
    availableTools: availableTools || [],
  };
}

export function pageSuggestions(route) {
  if (route.startsWith("/builder")) {
    return [
      "Summarize the response on this tab",
      "What request am I editing?",
      "Send this request and explain the result",
    ];
  }
  if (route.startsWith("/conduits")) {
    return [
      "Add my open request to this conduit and connect it to comment",
      "Update userId to 10 on the selected step",
      "Run this conduit",
    ];
  }
  if (route.startsWith("/environments")) {
    return [
      "Create a Production environment",
      "What variables are in my active env?",
    ];
  }
  if (route.startsWith("/collections")) {
    return ["Create a new collection for user APIs"];
  }
  return [
    "What can you help me with on this page?",
    "Take me to the API builder",
  ];
}
