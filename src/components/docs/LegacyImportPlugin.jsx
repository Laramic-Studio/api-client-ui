import { useEffect, useRef } from "react";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $createParagraphNode, $getRoot } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { serializeDocs } from "@/lib/docs/format";

function ensureRootHasBlock() {
  const root = $getRoot();
  if (root.getChildrenSize() === 0) {
    root.append($createParagraphNode());
  }
}

export function LegacyImportPlugin({ legacyText, onMigrated }) {
  const [editor] = useLexicalComposerContext();
  const importedRef = useRef(false);

  useEffect(() => {
    if (!legacyText?.trim() || importedRef.current) return;
    importedRef.current = true;

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      $convertFromMarkdownString(legacyText, TRANSFORMERS);
      ensureRootHasBlock();
    });

    queueMicrotask(() => {
      onMigrated?.(serializeDocs(editor.getEditorState().toJSON()));
    });
  }, [editor, legacyText, onMigrated]);

  return null;
}
