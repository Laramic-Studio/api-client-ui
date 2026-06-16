import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const DEFAULT_BODY = '{\n  \n}';

export default function AddExampleDialog({ open, onOpenChange, request, onSubmit, saving }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("200");
  const [statusText, setStatusText] = useState("OK");
  const [body, setBody] = useState(DEFAULT_BODY);

  useEffect(() => {
    if (!open || !request) return;
    const count = (request.examples?.length || 0) + 1;
    setName(`Example ${count}`);
    setStatus("200");
    setStatusText("OK");
    setBody(DEFAULT_BODY);
  }, [open, request]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!request) return;
    let parsedBody = body;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = body;
    }
    onSubmit({
      name: name.trim() || `Example ${(request.examples?.length || 0) + 1}`,
      status: Number(status) || 200,
      statusText: statusText.trim() || "OK",
      headers: { "Content-Type": "application/json" },
      body: parsedBody,
      url: request.url,
      method: request.method,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-[hsl(var(--card))] border-[hsl(var(--border))] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[hsl(var(--border))]">
          <DialogTitle className="text-[15px]">Add example response</DialogTitle>
          {request && (
            <p className="text-[12px] text-muted-foreground font-mono truncate">
              {request.method} {request.name}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-5 py-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="example-name" className="text-[12px]">Example name</Label>
              <Input
                id="example-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-[13px] bg-[hsl(var(--input))] border-[hsl(var(--border))]"
                placeholder="Example 1"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="example-status" className="text-[12px]">Status code</Label>
                <Input
                  id="example-status"
                  type="number"
                  min={100}
                  max={599}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-8 text-[13px] font-mono bg-[hsl(var(--input))] border-[hsl(var(--border))]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="example-status-text" className="text-[12px]">Status text</Label>
                <Input
                  id="example-status-text"
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  className="h-8 text-[13px] bg-[hsl(var(--input))] border-[hsl(var(--border))]"
                  placeholder="OK"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Response body</Label>
              <div className="h-44 rounded-md border border-[hsl(var(--border))] overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  language="json"
                  value={body}
                  onChange={(v) => setBody(v || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    fontFamily: "JetBrains Mono, monospace",
                    scrollBeyondLastLine: false,
                    padding: { top: 8 },
                    lineNumbers: "off",
                  }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]/50">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              {saving ? "Saving…" : "Add example"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
