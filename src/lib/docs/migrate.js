import { createHeadlessEditor } from "@lexical/headless";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $createParagraphNode, $getRoot } from "lexical";
import { parseDocs, serializeDocs } from "@/lib/docs/format";
import { DOCS_LEXICAL_NODES } from "@/components/docs/lexical-nodes";

function ensureRootHasBlock() {
  const root = $getRoot();
  if (root.getChildrenSize() === 0) {
    root.append($createParagraphNode());
  }
}

export function migrateLegacyDocs(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";

  const parsed = parseDocs(trimmed);
  if (parsed.format === "lexical") {
    return serializeDocs(parsed.state);
  }

  const editor = createHeadlessEditor({
    namespace: "NoidrDocsMigrate",
    nodes: DOCS_LEXICAL_NODES,
    onError() {},
  });

  editor.update(() => {
    const root = $getRoot();
    root.clear();
    $convertFromMarkdownString(parsed.legacyText, TRANSFORMERS);
    ensureRootHasBlock();
  }, { discrete: true });

  return serializeDocs(editor.getEditorState().toJSON());
}

export function normalizeDocs(raw) {
  return migrateLegacyDocs(raw);
}
