import { summarizeResponseForAi } from "@/lib/ai/snapshot";
import { useAppStore } from "@/store/useAppStore";

function formatBodyPreview(response) {
  const preview = summarizeResponseForAi(response)?.bodyPreview || "";
  if (!preview) return "(empty body)";
  return preview;
}

/** Human-readable summary for chat after a builder send. */
export function formatResponseSummaryForChat(response) {
  if (!response) return null;

  const statusLine = `**${response.status} ${response.statusText || ""}** · ${response.durationMs ?? "—"} ms`;
  const requestLine = `${response.method || "GET"} ${response.url || ""}`;
  const body = formatBodyPreview(response);

  const parts = [
    "### Response summary",
    statusLine,
    requestLine,
    "",
    body,
  ];

  if (response.corsBlocked) {
    parts.push("", "_Browser blocked this request (CORS). Retry via cloud if needed._");
  }

  return parts.join("\n");
}

export function getActiveBuilderResponseSummary() {
  const state = useAppStore.getState();
  const tabId = state.activeTabId;
  if (!tabId) return null;
  const response = state.builderSession?.responses?.[tabId];
  return formatResponseSummaryForChat(response);
}
