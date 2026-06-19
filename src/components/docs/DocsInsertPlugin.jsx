import { useEffect } from "react";
import { $getRoot, $getSelection, $isRangeSelection, $createParagraphNode } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { INSERT_API_EXAMPLE_COMMAND, INSERT_API_PARAMS_TABLE_COMMAND } from "@/components/docs/docs-commands";
import { $createApiParamsTableNode } from "@/components/docs/nodes/ApiParamsTableNode";
import { $createApiExampleNode } from "@/components/docs/nodes/ApiExampleNode";

function insertBlockNode(getNode) {
  const selection = $getSelection();
  const node = getNode();

  if ($isRangeSelection(selection)) {
    selection.insertNodes([node]);
    return;
  }

  $getRoot().append(node);
  const paragraph = $createParagraphNode();
  $getRoot().append(paragraph);
}

export default function DocsInsertPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => mergeRegister(
    editor.registerCommand(
      INSERT_API_PARAMS_TABLE_COMMAND,
      (payload) => {
        editor.update(() => {
          insertBlockNode(() => $createApiParamsTableNode(payload.source, payload.rows));
        });
        return true;
      },
      1,
    ),
    editor.registerCommand(
      INSERT_API_EXAMPLE_COMMAND,
      (payload) => {
        editor.update(() => {
          insertBlockNode(() => $createApiExampleNode(payload.example));
        });
        return true;
      },
      1,
    ),
  ), [editor]);

  return null;
}
