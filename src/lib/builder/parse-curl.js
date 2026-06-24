/** Detect a pasted cURL command. */
export function looksLikeCurl(text) {
  return /^\s*curl\s+/i.test(String(text || "").trim());
}

/** Normalize line continuations and excess whitespace. */
function normalizeCurlInput(input) {
  return String(input || "")
    .replace(/\\\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenize a curl command respecting single/double quotes. */
function tokenizeCurl(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    while (i < input.length && /\s/.test(input[i])) i += 1;
    if (i >= input.length) break;

    const quote = input[i];
    if (quote === "'" || quote === '"') {
      i += 1;
      let value = "";
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < input.length) {
          value += input[++i];
        } else {
          value += input[i];
        }
        i += 1;
      }
      if (input[i] === quote) i += 1;
      tokens.push(value);
      continue;
    }

    let value = "";
    while (i < input.length && !/\s/.test(input[i])) {
      value += input[i];
      i += 1;
    }
    if (value) tokens.push(value);
  }

  return tokens;
}

function isUrlToken(token) {
  return /^https?:\/\//i.test(token) || token.startsWith("[[") || token.startsWith("{{");
}

function parseHeaderValue(raw) {
  const idx = raw.indexOf(":");
  if (idx <= 0) return null;
  return {
    key: raw.slice(0, idx).trim(),
    value: raw.slice(idx + 1).trim(),
    enabled: true,
  };
}

function splitUrlAndParams(url) {
  const qIndex = url.indexOf("?");
  if (qIndex === -1) return { url, params: [] };

  const base = url.slice(0, qIndex);
  const search = url.slice(qIndex + 1);
  const params = [];

  for (const part of search.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const key = decodeURIComponent(eq >= 0 ? part.slice(0, eq) : part);
    const value = decodeURIComponent(eq >= 0 ? part.slice(eq + 1) : "");
    if (key) params.push({ key, value, enabled: true });
  }

  return { url: base, params };
}

function inferBody(content, headers) {
  if (!content) return { type: "none", content: "" };

  const contentType = headers.find((h) => h.key.toLowerCase() === "content-type")?.value?.toLowerCase() || "";

  if (contentType.includes("application/json") || /^[\[{]/.test(content.trim())) {
    return { type: "json", content };
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formRows = content.split("&").map((pair) => {
      const eq = pair.indexOf("=");
      return {
        key: decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair),
        value: decodeURIComponent(eq >= 0 ? pair.slice(eq + 1) : ""),
        enabled: true,
      };
    });
    return { type: "form", content: "", formRows };
  }
  if (contentType.includes("xml")) {
    return { type: "xml", content };
  }

  return { type: "raw", content };
}

const SKIP_FLAGS = new Set([
  "-s", "-S", "-sS", "-v", "-i", "-I", "-L", "-k", "-K", "--silent", "--show-error",
  "--verbose", "--include", "--head", "--location", "--insecure", "--compressed",
  "--fail", "--fail-with-body", "-O", "--remote-name",
]);

/**
 * Parse a cURL command into builder request fields.
 * @returns {{ method: string, url: string, params: Array, headers: Array, body: object, auth?: object } | null}
 */
export function parseCurlCommand(input) {
  const normalized = normalizeCurlInput(input);
  if (!looksLikeCurl(normalized)) return null;

  const tokens = tokenizeCurl(normalized);
  if (!tokens.length || tokens[0].toLowerCase() !== "curl") return null;

  let method = null;
  let url = "";
  const headers = [];
  let data = null;
  let useGet = false;
  let auth = null;

  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (SKIP_FLAGS.has(token)) continue;

    if (token === "-X" || token === "--request") {
      method = (tokens[++i] || "GET").toUpperCase();
      continue;
    }

    if (token === "-H" || token === "--header") {
      const header = parseHeaderValue(tokens[++i] || "");
      if (header) headers.push(header);
      continue;
    }

    if (token === "-A" || token === "--user-agent") {
      headers.push({ key: "User-Agent", value: tokens[++i] || "", enabled: true });
      continue;
    }

    if (token === "-d" || token === "--data" || token === "--data-raw" || token === "--data-binary" || token === "--json") {
      data = tokens[++i] ?? "";
      if (token === "--json") {
        headers.push({ key: "Content-Type", value: "application/json", enabled: true });
      }
      continue;
    }

    if (token === "-G" || token === "--get") {
      useGet = true;
      continue;
    }

    if (token === "-u" || token === "--user") {
      const creds = tokens[++i] || "";
      const colon = creds.indexOf(":");
      auth = {
        type: "basic",
        username: colon >= 0 ? creds.slice(0, colon) : creds,
        password: colon >= 0 ? creds.slice(colon + 1) : "",
      };
      continue;
    }

    if (token.startsWith("-")) continue;

    if (isUrlToken(token)) {
      url = token;
    }
  }

  if (!url) return null;

  if (useGet && data) {
    url = url.includes("?") ? `${url}&${data}` : `${url}?${data}`;
    data = null;
  }

  const { url: baseUrl, params } = splitUrlAndParams(url);
  const body = inferBody(data, headers);
  const resolvedMethod = method || (data ? "POST" : "GET");

  const result = {
    method: resolvedMethod,
    url: baseUrl,
    params,
    headers,
    body,
  };

  if (auth) result.auth = auth;
  return result;
}

/** Merge parsed headers into existing KV rows (parsed wins on conflict). */
export function mergeParsedHeaders(existing = [], incoming = []) {
  const map = new Map(
    existing.filter((row) => row.key).map((row) => [row.key.toLowerCase(), row]),
  );
  for (const row of incoming) {
    map.set(row.key.toLowerCase(), row);
  }
  return Array.from(map.values());
}
