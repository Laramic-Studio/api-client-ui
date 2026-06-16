/** Extract a value from an object using dot notation (e.g. "user.id"). */
export function extractByPath(obj, path) {
  if (!path || obj == null) return undefined;
  return path.split(".").reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

/** Replace {var} and {user.id} placeholders with conduit flow variables. */
export function substituteConduitVars(str, vars) {
  if (!str) return "";
  return str.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, key) => {
    const value = vars[key];
    if (value === undefined || value === null) return match;
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  });
}
