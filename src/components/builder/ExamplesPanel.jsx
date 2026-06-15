import Editor from "@monaco-editor/react";
import { Plus, Trash2, FileJson } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { useState } from "react";
import { toast } from "sonner";

export default function ExamplesPanel({ examples = [], response, onAdd, onDelete }) {
  const [selectedId, setSelectedId] = useState(examples[0]?.id);
  const selected = examples.find((e) => e.id === selectedId);

  const saveCurrent = () => {
    if (!response) {
      toast.error("Send a request first to capture a response");
      return;
    }
    const name = `Example ${examples.length + 1}`;
    const ex = onAdd({
      name,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body: response.body,
      url: response.url,
      method: response.method,
    });
    setSelectedId(ex?.id);
    toast.success(`Saved "${name}"`);
  };

  return (
    <div className="h-full grid grid-cols-[200px_1fr]">
      <div className="border-r border-[hsl(var(--border))] flex flex-col">
        <div className="h-9 shrink-0 flex items-center px-3 border-b border-[hsl(var(--border))]">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Saved</div>
          <button
            onClick={saveCurrent}
            data-testid="examples-save-current"
            className="ml-auto h-6 px-1.5 rounded text-[11px] border border-[hsl(var(--border))] hover:bg-accent/50 inline-flex items-center gap-1"
            title="Save current response as example"
          >
            <Plus className="h-3 w-3" /> Save
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {examples.length === 0 && (
            <div className="px-2 py-4 text-[11.5px] text-muted-foreground leading-relaxed">
              Send a request, then click <span className="font-mono">Save</span> to capture an example response.
            </div>
          )}
          {examples.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedId(ex.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-[12px] flex items-center gap-2 hover:bg-accent/50 ${selectedId === ex.id ? "bg-accent" : ""}`}
            >
              <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate flex-1">{ex.name}</span>
              <StatusBadge status={ex.status} className="text-[10px] py-0" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col min-w-0">
        {selected ? (
          <>
            <div className="h-9 shrink-0 flex items-center gap-2 px-3 border-b border-[hsl(var(--border))]">
              <StatusBadge status={selected.status} />
              <div className="text-[12.5px] font-medium truncate">{selected.name}</div>
              <div className="ml-auto text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                {new Date(selected.savedAt).toLocaleString()}
              </div>
              <button
                onClick={() => { onDelete(selected.id); setSelectedId(examples.find((e) => e.id !== selected.id)?.id); toast.success("Example deleted"); }}
                className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-[hsl(var(--danger))] hover:bg-accent/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                defaultLanguage="json"
                language="json"
                value={typeof selected.body === "string" ? selected.body : JSON.stringify(selected.body, null, 2)}
                theme="vs-dark"
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, fontFamily: "JetBrains Mono, monospace", padding: { top: 10 } }}
              />
            </div>
          </>
        ) : (
          <div className="h-full grid place-items-center text-muted-foreground text-[12.5px]">No example selected</div>
        )}
      </div>
    </div>
  );
}
