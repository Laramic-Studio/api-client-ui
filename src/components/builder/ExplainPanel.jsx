import { useState } from "react";
import { Sparkles, X, Loader2, AlertTriangle } from "lucide-react";
import { aiExplainResponse } from "@/lib/api/ai";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";

export default function ExplainPanel({ response, onClose }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const ai = useAppStore((s) => s.aiSettings);
  const user = useAppStore((s) => s.user);
  const bumpUsage = useAppStore((s) => s.bumpAiUsage);
  const isError = response && response.status >= 400;

  const run = async () => {
    setLoading(true);
    setText("");
    try {
      await aiExplainResponse({
        method: response.method,
        url: response.url,
        status: response.status,
        body: response.body,
        headers: response.headers,
        userId: user?.id,
        ai,
        onDelta: (_d, full) => setText(full),
      });
      bumpUsage("explain");
    } catch (e) {
      toast.error(e.message || "AI explain failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-[hsl(var(--border))] bg-card max-h-[40%] flex flex-col" data-testid="explain-panel">
      <div className="h-9 flex items-center px-3 border-b border-[hsl(var(--border))]">
        <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--brand))]" />
        <div className="ml-2 text-[12.5px] font-medium">
          {isError ? "What went wrong?" : "Explain this response"}
        </div>
        {isError && <AlertTriangle className="ml-2 h-3.5 w-3.5 text-[hsl(var(--warning))]" />}
        <button
          onClick={run}
          disabled={loading}
          data-testid="explain-run"
          className="ml-auto h-7 px-2 rounded text-[11px] border border-[hsl(var(--border))] hover:bg-accent/40 inline-flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {loading ? "Streaming…" : (text ? "Regenerate" : "Run")}
        </button>
        <button onClick={onClose} className="ml-1 h-7 w-7 grid place-items-center rounded hover:bg-accent/40 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/90">
        {text || (loading ? "Asking Gemini…" : "Click Run to get an AI explanation of this response.")}
      </div>
    </div>
  );
}
