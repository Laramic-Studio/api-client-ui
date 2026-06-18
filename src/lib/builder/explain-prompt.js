export function buildExplainPrompt(response) {
  const bodyStr = (() => {
    if (typeof response.body === "string") return response.body;
    try {
      return JSON.stringify(response.body, null, 2);
    } catch {
      return String(response.body ?? response.rawText ?? "");
    }
  })();

  const trimmedBody = bodyStr.length > 8000 ? `${bodyStr.slice(0, 8000)}\n… (truncated)` : bodyStr;
  const isError = response.status >= 400;

  return [
    isError
      ? "Explain what went wrong with this API response. Be concise and practical — mention likely causes and what to try next."
      : "Explain this API response in plain language. Summarize what it means and highlight anything notable.",
    "",
    `Method: ${response.method || "GET"}`,
    `URL: ${response.url || ""}`,
    `Status: ${response.status} ${response.statusText || ""}`,
    `Duration: ${response.durationMs ?? "—"} ms`,
    "",
    "Response headers:",
    JSON.stringify(response.headers || {}, null, 2),
    "",
    "Response body:",
    trimmedBody,
  ].join("\n");
}
