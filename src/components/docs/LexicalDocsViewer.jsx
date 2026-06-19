import { useMemo } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { cn } from "@/lib/utils";
import { docsEditorTheme } from "@/lib/docs/theme";
import { parseDocs, isEmptyDocs, ensureValidDocsState } from "@/lib/docs/format";
import { DOCS_LEXICAL_NODES } from "@/components/docs/lexical-nodes";
import { LegacyImportPlugin } from "@/components/docs/LegacyImportPlugin";

function DocsViewerShell({ className }) {
  return (
    <div className={cn("docs-editor-readonly", className)}>
      <RichTextPlugin
        contentEditable={(
          <ContentEditable
            className="docs-editor-surface outline-none text-[13.5px] leading-relaxed text-foreground/90"
          />
        )}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <LinkPlugin />
    </div>
  );
}

export function LexicalDocsViewer({
  value,
  className,
  placeholder = "No documentation yet.",
}) {
  const parsed = useMemo(() => parseDocs(value), [value]);
  const isEmpty = isEmptyDocs(value);

  const initialConfig = useMemo(() => ({
    namespace: "NoidrDocsViewer",
    theme: docsEditorTheme,
    nodes: DOCS_LEXICAL_NODES,
    editable: false,
    onError(error) {
      console.error(error);
    },
    editorState: parsed.format === "lexical"
      ? JSON.stringify(ensureValidDocsState(parsed.state))
      : undefined,
  }), [parsed.format, parsed.state]);

  if (isEmpty) {
    return (
      <div className={cn("text-[13px] text-muted-foreground", className)}>
        {placeholder}
      </div>
    );
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {parsed.format === "legacy" && (
        <LegacyImportPlugin legacyText={parsed.legacyText} />
      )}
      <DocsViewerShell className={className} />
    </LexicalComposer>
  );
}
