export function createConsoleLogEntry({ phase, level = "log", message }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "log",
    ts: Date.now(),
    phase,
    level,
    message,
  };
}

export function createNetworkConsoleEntry({ method, url, status, statusText, durationMs }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "network",
    ts: Date.now(),
    method,
    url,
    status,
    statusText,
    durationMs,
  };
}

export function scriptLogsToConsoleEntries(logs = []) {
  return logs.map((entry) => createConsoleLogEntry({
    phase: entry.phase,
    level: entry.level || "log",
    message: entry.message,
  }));
}

export function countConsoleIssues(entries = []) {
  let errors = 0;
  let warnings = 0;
  entries.forEach((entry) => {
    if (entry.type === "log" && entry.level === "error") errors += 1;
    if (entry.type === "log" && entry.level === "warn") warnings += 1;
    if (entry.type === "network" && entry.status >= 400) errors += 1;
  });
  return { errors, warnings, total: entries.length };
}
