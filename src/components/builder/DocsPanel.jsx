import LexicalDocsEditor from "@/components/docs/LexicalDocsEditor";

export default function DocsPanel({ value, onChange, editorKey, request }) {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <LexicalDocsEditor
        value={value}
        onChange={onChange}
        editorKey={editorKey}
        request={request}
        className="h-full"
      />
    </div>
  );
}
