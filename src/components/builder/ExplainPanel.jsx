import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Loader2, AlertTriangle } from "lucide-react";
import { aiChat, createAbortController, isCancelledError } from "@/lib/api/ai";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";

function buildExplainPrompt(response) {
  const bodyStr = (() => {
    if (typeof response.body === "string") return response.body;
    try {
      return JSON.stringify(response.body, null, 2);
    } catch {
      return String(response.body ?? response.rawText ?? "");
    }
  })();

  const trimmedBody = bodyStr.length > 8000 ? `${bodyStr.slice(0, 8000)}\n… (truncated)` : bodyStr;
  const isError = response.status >= 400;

  return [
    isError
      ? "Explain what went wrong with this API response. Be concise and practical — mention likely causes and what to try next."
      : "Explain this API response in plain language. Summarize what it means and highlight anything notable.",
    "",
    `Method: ${response.method || "GET"}`,
    `URL: ${response.url || ""}`,
    `Status: ${response.status} ${response.statusText || ""}`,
    `Duration: ${response.durationMs ?? "—"} ms`,
    "",
    "Response headers:",
    JSON.stringify(response.headers || {}, null, 2),
    "",
    "Response body:",
    trimmedBody,
  ].join("\n");
}

function friendlyAiError(message) {
  const m = String(message || "").toLowerCase();
  if (m.includes("11434") || m.includes("connection refused") || m.includes("ollama")) {
    return "AI is unavailable. Start Ollama locally (ollama serve) or check Settings → AI.";
  }
  return message || "AI explain failed";
}

export default function ExplainPanel({ response, onClose, runToken = 0 }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const ai = useAppStore((s) => s.aiSettings);
  const user = useAppStore((s) => s.user);
  const bumpUsage = useAppStore((s) => s.bumpAiUsage);
  const abortRef = useRef(null);
  const isError = response && response.status >= 400;

  const run = async () => {
    if (!response) return;
    abortRef.current?.abort();
    const controller = createAbortController();
    abortRef.current = controller;
    setLoading(true);
    setText("");

    try {
      await aiChat({
        messages: [{ role: "user", content: buildExplainPrompt(response) }],
        context: {
          pageId: "api-builder",
          task: "explain-response",
          response: {
            method: response.method,
            url: response.url,
            status: response.status,
            statusText: response.statusText,
          },
        },
        userId: user?.id,
        ai,
        signal: controller.signal,
        onDelta: (_delta, full) => setText(full),
      });
      bumpUsage("explain");
    } catch (e) {
      if (!isCancelledError(e)) {
        const msg = friendlyAiError(e.message);
        setText(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  useEffect(() => {
    if (!runToken) return undefined;
    run();
    return () => abortRef.current?.abort();
  }, [runToken]);

  useEffect(() => () => abortRef.current?.abort(), []);

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
        {text || (loading ? "Analyzing response…" : "Click Run to get an AI explanation.")}
      </div>
    </div>
  );
}
