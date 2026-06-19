import { useEffect, useMemo, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { cn } from "@/lib/utils";
import { docsEditorTheme } from "@/lib/docs/theme";
import { parseDocs, serializeDocs, ensureValidDocsState } from "@/lib/docs/format";
import { DOCS_LEXICAL_NODES } from "@/components/docs/lexical-nodes";
import { DocsRequestProvider } from "@/components/docs/DocsRequestContext";
import { LegacyImportPlugin } from "@/components/docs/LegacyImportPlugin";
import DocsToolbar from "@/components/docs/DocsToolbar";
import DocsInsertPlugin from "@/components/docs/DocsInsertPlugin";

function DocsEditorShell({ className, placeholder }) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <DocsToolbar />
      <div className="relative min-h-0 flex-1 overflow-auto">
        <RichTextPlugin
          contentEditable={(
            <ContentEditable
              className="docs-editor-surface min-h-full px-4 py-3 outline-none text-[13.5px] leading-relaxed text-foreground/90"
              aria-placeholder={placeholder}
            />
          )}
          placeholder={(
            <div className="pointer-events-none absolute left-4 top-3 text-[13px] text-muted-foreground">
              {placeholder}
            </div>
          )}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <DocsInsertPlugin />
      </div>
    </div>
  );
}

export default function LexicalDocsEditor({
  value,
  onChange,
  editorKey,
  request = null,
  className,
  placeholder = "Describe this endpoint — purpose, auth notes, parameters, examples…",
}) {
  const parsed = useMemo(() => parseDocs(value), [value]);

  const initialConfig = useMemo(() => ({
    namespace: "NoidrDocsEditor",
    theme: docsEditorTheme,
    nodes: DOCS_LEXICAL_NODES,
    onError(error) {
      console.error(error);
    },
    editorState: parsed.format === "lexical"
      ? JSON.stringify(ensureValidDocsState(parsed.state))
      : undefined,
  }), [parsed.format, parsed.state]);

  const lastSerializedRef = useRef(value);

  const handleChange = (editorState) => {
    const next = serializeDocs(editorState.toJSON());
    if (next === lastSerializedRef.current) return;
    lastSerializedRef.current = next;
    onChange?.(next);
  };

  const handleMigrated = (serialized) => {
    if (serialized === lastSerializedRef.current) return;
    lastSerializedRef.current = serialized;
    onChange?.(serialized);
  };

  return (
    <DocsRequestProvider request={request}>
      <LexicalComposer initialConfig={initialConfig} key={editorKey}>
        {parsed.format === "legacy" && (
          <LegacyImportPlugin legacyText={parsed.legacyText} onMigrated={handleMigrated} />
        )}
        <DocsEditorShell className={className} placeholder={placeholder} />
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
      </LexicalComposer>
    </DocsRequestProvider>
  );
}
