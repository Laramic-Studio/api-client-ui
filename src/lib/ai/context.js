export function buildAiContextBundle({ route, user, workspace, team, pageContext }) {
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
    page: pageContext || null,
  };
}

export function pageSuggestions(route) {
  if (route.startsWith("/builder")) {
    return [
      "Build a POST request to create a user",
      "What request am I editing?",
      "Add bearer auth from my environment",
    ];
  }
  if (route.startsWith("/environments")) {
    return [
      "Create a Production environment",
      "What variables are in my active env?",
    ];
  }
  if (route.startsWith("/conduits")) {
    return [
      "Explain how fan-out works in conduits",
      "Add a step that extracts an ID from the response",
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
