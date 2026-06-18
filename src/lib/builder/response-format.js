export function getResponseContentType(response) {
  const headers = response?.headers || {};
  const key = Object.keys(headers).find((k) => k.toLowerCase() === "content-type");
  return key ? headers[key] : "";
}

export function inferPrettyLanguage(response) {
  const contentType = getResponseContentType(response).toLowerCase();
  if (contentType.includes("json")) return "json";
  if (contentType.includes("html")) return "html";
  if (contentType.includes("xml")) return "xml";
  if (typeof response?.body === "object" && response.body !== null) return "json";
  return "plaintext";
}

export function formatPrettyBody(response) {
  const body = response?.body;
  if (typeof body === "string") return body;
  if (body == null) return response?.rawText || "";
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}

export function isLikelyCorsError(message) {
  const m = String(message || "").toLowerCase();
  return m.includes("failed to fetch")
    || m.includes("networkerror")
    || m.includes("network error")
    || m.includes("cors");
}

export function corsHintMessage() {
  return "Browser blocked this request (CORS). The API must allow your origin, or use a server-side proxy.";
}
