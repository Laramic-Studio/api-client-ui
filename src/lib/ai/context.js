export function buildAiContextBundle({ route, user, workspace, team, pageContext, catalog }) {
  return {
    route: route || "/",
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
    catalog: catalog || null,
    page: pageContext || null,
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
      "Open my web conduit",
      "Chain my GET post and comment requests into a flow",
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
