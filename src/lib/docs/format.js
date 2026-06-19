export const DOCS_FORMAT_VERSION = 1;

export function createEmptyDocsState() {
  return {
    root: {
      children: [
        {
          children: [],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
          textFormat: 0,
          textStyle: "",
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

/** Lexical requires the root node to always have at least one block child. */
export function ensureValidDocsState(state) {
  if (state?.root?.type !== "root") {
    return createEmptyDocsState();
  }
  const children = state.root.children;
  if (!Array.isArray(children) || children.length === 0) {
    return createEmptyDocsState();
  }
  return state;
}

export function serializeDocs(state) {
  return JSON.stringify({ v: DOCS_FORMAT_VERSION, state: ensureValidDocsState(state) });
}

export function parseDocs(raw) {
  const text = String(raw ?? "").trim();
  if (!text) {
    return { state: createEmptyDocsState(), format: "lexical" };
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed?.v === DOCS_FORMAT_VERSION && parsed?.state?.root) {
      return { state: ensureValidDocsState(parsed.state), format: "lexical" };
    }
    if (parsed?.root?.type === "root") {
      return { state: ensureValidDocsState(parsed), format: "lexical" };
    }
  } catch {
    // legacy plain text or markdown
  }

  return { legacyText: text, format: "legacy" };
}

function collectNodeText(node, parts) {
  if (!node) return;
  if (node.type === "text") {
    parts.push(node.text || "");
    return;
  }
  if (node.type === "linebreak") {
    parts.push("\n");
    return;
  }
  (node.children || []).forEach((child) => collectNodeText(child, parts));
}

function blockToPlainText(node) {
  const parts = [];
  collectNodeText(node, parts);
  return parts.join("").trim();
}

export function docsToPlainText(raw) {
  const parsed = parseDocs(raw);
  if (parsed.format === "legacy") return parsed.legacyText || "";

  const blocks = parsed.state?.root?.children || [];
  const lines = blocks.map((block) => {
    if (block.type === "api-params-table") {
      const label = block.source === "headers" ? "Headers" : "Query parameters";
      const rows = (block.rows || []).filter((row) => row.key);
      return `${label}:\n${rows.map((row) => `- ${row.key}: ${row.value || ""}`).join("\n")}`.trim();
    }
    if (block.type === "api-example") {
      const example = block.example || {};
      const body = typeof example.body === "string"
        ? example.body
        : JSON.stringify(example.body ?? {});
      return `Example ${example.status || ""} ${example.name || ""}: ${body}`.trim();
    }
    if (block.type === "heading") {
      const level = Number(String(block.tag || "h1").replace("h", "")) || 1;
      return `${"#".repeat(level)} ${blockToPlainText(block)}`.trim();
    }
    if (block.type === "list") {
      return (block.children || [])
        .map((item) => `- ${blockToPlainText(item)}`.trim())
        .join("\n");
    }
    if (block.type === "code") {
      return blockToPlainText(block);
    }
    return blockToPlainText(block);
  });

  return lines.filter(Boolean).join("\n\n").trim();
}

export function isEmptyDocs(raw) {
  const parsed = parseDocs(raw);
  if (parsed.format === "legacy") return !parsed.legacyText?.trim();

  const blocks = parsed.state?.root?.children || [];
  if (blocks.some((block) => block.type === "api-params-table" || block.type === "api-example")) {
    return false;
  }

  return !docsToPlainText(raw);
}

/** Stable key segment so Lexical remounts when docs change externally (e.g. AI set_docs). */
export function docsRevisionKey(raw) {
  const s = String(raw ?? "");
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return `${hash >>> 0}-${s.length}`;
}
