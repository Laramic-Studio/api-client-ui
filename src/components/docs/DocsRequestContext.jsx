import { createContext, useContext } from "react";

const DocsRequestContext = createContext(null);

export function DocsRequestProvider({ request, children }) {
  return (
    <DocsRequestContext.Provider value={request}>
      {children}
    </DocsRequestContext.Provider>
  );
}

export function useDocsRequest() {
  return useContext(DocsRequestContext);
}

export function snapshotKvRows(rows) {
  return (rows || [])
    .filter((row) => row.key)
    .map((row) => ({
      key: row.key,
      value: row.value ?? "",
      enabled: row.enabled !== false,
    }));
}

export function formatExampleBody(body) {
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body ?? "");
  }
}
