import { useCallback, useEffect, useState } from "react";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { $createHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $createCodeNode } from "@lexical/code";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  Bold, Italic, Underline, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Link2, FileCode2, Table2, Braces,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { $createParagraphNode } from "lexical";
import { useDocsRequest, snapshotKvRows } from "@/components/docs/DocsRequestContext";
import {
  INSERT_API_EXAMPLE_COMMAND,
  INSERT_API_PARAMS_TABLE_COMMAND,
} from "@/components/docs/docs-commands";
import { toast } from "sonner";

function ToolbarButton({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-40",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-[hsl(var(--border))] mx-0.5" />;
}

export default function DocsToolbar() {
  const [editor] = useLexicalComposerContext();
  const request = useDocsRequest();
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    code: false,
    link: false,
    block: "paragraph",
  });

  const syncToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      setActive({
        bold: selection.hasFormat("bold"),
        italic: selection.hasFormat("italic"),
        underline: selection.hasFormat("underline"),
        code: selection.hasFormat("code"),
        link: $isLinkNode(selection.anchor.getNode().getParent()) || $isLinkNode(selection.anchor.getNode()),
        block: getBlockType(selection),
      });
    });
  }, [editor]);

  useEffect(() => mergeRegister(
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => syncToolbar());
    }),
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        syncToolbar();
        return false;
      },
      1,
    ),
  ), [editor, syncToolbar]);

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (tag) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () => $createHeadingNode(tag));
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () => $createParagraphNode());
    });
  };

  const insertCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () => $createCodeNode());
    });
  };

  const toggleLink = () => {
    if (active.link) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    const url = window.prompt("Link URL");
    if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  const insertParamsTable = (source) => {
    const rows = snapshotKvRows(source === "headers" ? request?.headers : request?.params);
    editor.dispatchCommand(INSERT_API_PARAMS_TABLE_COMMAND, { source, rows });
  };

  const insertExample = () => {
    const examples = request?.examples || [];
    if (!examples.length) {
      toast.info("Save a response example on this request first.");
      return;
    }

    let example = examples[0];
    if (examples.length > 1) {
      const names = examples.map((ex, idx) => `${idx + 1}. ${ex.name || `Example ${idx + 1}`}`).join("\n");
      const pick = window.prompt(`Choose example (1-${examples.length}):\n${names}`, "1");
      const index = Number(pick) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= examples.length) return;
      example = examples[index];
    }

    editor.dispatchCommand(INSERT_API_EXAMPLE_COMMAND, {
      example: {
        id: example.id,
        name: example.name,
        status: example.status,
        statusText: example.statusText,
        method: example.method || request?.method,
        url: example.url || request?.url,
        headers: example.headers || {},
        body: example.body,
      },
    });
  };

  return (
    <div className="shrink-0 flex items-center gap-0.5 px-2 h-9 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 overflow-x-auto">
      <ToolbarButton active={active.bold} onClick={() => formatText("bold")} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton active={active.italic} onClick={() => formatText("italic")} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton active={active.underline} onClick={() => formatText("underline")} title="Underline">
        <Underline className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton active={active.code} onClick={() => formatText("code")} title="Inline code">
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton active={active.block === "h1"} onClick={() => formatHeading("h1")} title="Heading 1">
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton active={active.block === "h2"} onClick={() => formatHeading("h2")} title="Heading 2">
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton active={active.block === "h3"} onClick={() => formatHeading("h3")} title="Heading 3">
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton active={active.block === "paragraph"} onClick={formatParagraph} title="Paragraph">
        <span className="text-[10px] font-mono uppercase tracking-wide">P</span>
      </ToolbarButton>
      <Divider />
      <ToolbarButton onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} title="Bullet list">
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} title="Numbered list">
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton active={active.block === "code"} onClick={insertCodeBlock} title="Code block">
        <FileCode2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton active={active.link} onClick={toggleLink} title="Link">
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      {request && (
        <>
          <Divider />
          <ToolbarButton onClick={() => insertParamsTable("params")} title="Insert query parameters table">
            <Table2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertParamsTable("headers")} title="Insert headers table">
            <span className="text-[9px] font-mono uppercase tracking-wide">Hdr</span>
          </ToolbarButton>
          <ToolbarButton onClick={insertExample} title="Insert example response">
            <Braces className="h-3.5 w-3.5" />
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

function getBlockType(selection) {
  const anchor = selection.anchor.getNode();
  const element = anchor.getKey() === "root"
    ? anchor
    : anchor.getTopLevelElementOrThrow();
  const type = element.getType();

  if (type === "heading") return element.getTag();
  if (type !== "list") return type;

  const parent = anchor.getParent();
  if (!$isListNode(parent)) return type;
  const list = $getNearestNodeOfType(anchor, ListNode);
  return list ? list.getListType() : type;
}
