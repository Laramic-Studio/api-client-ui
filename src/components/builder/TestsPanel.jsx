import Editor from "@monaco-editor/react";

export default function TestsPanel({ tests, onChange }) {
  return (
    <div className="h-full min-h-0">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        language="javascript"
        value={tests || ""}
        onChange={(v) => onChange(v || "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "JetBrains Mono, monospace",
          padding: { top: 8 },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
        }}
      />
    </div>
  );
}
