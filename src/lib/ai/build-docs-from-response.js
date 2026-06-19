import { summarizeResponseForAi } from "@/lib/ai/snapshot";

function formatJsonBlock(value) {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
}

/**
 * Build markdown API docs from the open request + last response.
 */
export function buildDocsFromResponse(request, response, { title } = {}) {
  if (!request || !response) return null;

  const name = title || request.name || "API endpoint";
  const params = (request.params || []).filter((p) => p.enabled !== false && p.key);
  const headers = (request.headers || []).filter((h) => h.enabled !== false && h.key);
  const bodyPreview = summarizeResponseForAi(response)?.bodyPreview || "";

  const lines = [
    `# ${name}`,
    "",
    "## Overview",
    `${request.method || "GET"} \`${response.url || request.url || ""}\` — documented from the last response (${response.status} ${response.statusText || ""}).`,
    "",
    "## Request",
    "",
    `- **Method:** ${request.method || "GET"}`,
    `- **URL:** \`${request.url || ""}\``,
  ];

  if (params.length) {
    lines.push("", "### Query parameters", "", "| Key | Value |", "|-----|-------|");
    params.forEach((p) => lines.push(`| \`${p.key}\` | ${p.value || ""} |`));
  }

  if (headers.length) {
    lines.push("", "### Headers", "", "| Header | Value |", "|--------|-------|");
    headers.forEach((h) => lines.push(`| \`${h.key}\` | ${h.value || ""} |`));
  }

  if (request.auth?.type && request.auth.type !== "none") {
    lines.push("", `- **Auth:** ${request.auth.type}`);
  }

  lines.push(
    "",
    "## Response",
    "",
    `- **Status:** ${response.status} ${response.statusText || ""}`,
    `- **Duration:** ${response.durationMs ?? "—"} ms`,
    "",
    "### Example body",
    "",
    "```json",
    formatJsonBlock(bodyPreview),
    "```",
  );

  return lines.join("\n");
}
