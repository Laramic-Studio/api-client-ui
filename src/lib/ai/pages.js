export function resolveAiPageId(pathname) {
  if (pathname.startsWith("/builder")) return "api-builder";
  if (pathname.startsWith("/environments")) return "environments";
  if (pathname.startsWith("/collections")) return "collections";
  if (pathname.startsWith("/conduits")) return "conduits";
  if (pathname.startsWith("/team")) return "team";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/workspaces")) return "workspaces";
  return null;
}
