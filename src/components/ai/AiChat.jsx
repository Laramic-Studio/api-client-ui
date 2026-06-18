import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, Send, Sparkles, Square, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store/useAppStore";
import { useAiChat } from "@/hooks/use-ai-chat";
import { pageSuggestions } from "@/lib/ai/context";
import AiMessage from "@/components/ai/AiMessage";
import { AI } from "@/constants/testIds";

export default function AiChat() {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const prefillHandled = useRef(0);
  const location = useLocation();
  const ai = useAppStore((s) => s.aiSettings);
  const messages = useAppStore((s) => s.aiMessages);
  const clearMessages = useAppStore((s) => s.clearAiMessages);
  const aiChatPrefill = useAppStore((s) => s.aiChatPrefill);
  const aiChatAutoSend = useAppStore((s) => s.aiChatAutoSend);
  const aiChatPrefillToken = useAppStore((s) => s.aiChatPrefillToken);
  const clearAiChatPrefill = useAppStore((s) => s.clearAiChatPrefill);
  const {
    send,
    stop,
    streaming,
    runningActionId,
    runAction,
    dismissAction,
  } = useAiChat();

  const suggestions = pageSuggestions(location.pathname);

  useEffect(() => {
    if (!aiChatPrefill || !aiChatPrefillToken || prefillHandled.current === aiChatPrefillToken) return;
    prefillHandled.current = aiChatPrefillToken;
    setInput(aiChatPrefill);
    clearAiChatPrefill();
    if (aiChatAutoSend) {
      send(aiChatPrefill);
    }
  }, [aiChatPrefill, aiChatPrefillToken, aiChatAutoSend, clearAiChatPrefill, send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const submit = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    await send(text);
  };

  return (
    <div className="flex flex-col h-full min-h-0" data-testid={AI.chat}>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-4">
          {messages.length === 0 && (
            <div className="py-8 px-2 text-center space-y-3">
              <Sparkles className="h-8 w-8 mx-auto text-[hsl(var(--brand))]/70" />
              <div className="text-[13.5px] font-medium">NoIDR Assistant</div>
              <div className="text-[12px] text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
                I know this page and your workspace. Ask anything — I&apos;ll propose actions for you to run.
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInput(s)}
                    className="px-2 py-1 rounded border border-border text-[11px] text-muted-foreground hover:bg-accent/40 hover:text-foreground/85"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <AiMessage
              key={m.id}
              message={m}
              onRunAction={runAction}
              onDismissAction={dismissAction}
              runningActionId={runningActionId}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border p-3 space-y-2 bg-background">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span>
            {ai.provider}/{ai.model}
            {ai.useOwnKey ? " · your key" : ""}
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearMessages}
              className="inline-flex items-center gap-1 hover:text-foreground"
              data-testid={AI.clear}
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask anything…"
            rows={2}
            data-testid={AI.input}
            className="flex-1 min-h-[52px] max-h-32 resize-none rounded-md bg-muted border border-border px-3 py-2 text-[13px] ring-focus"
          />
          <div className="flex flex-col gap-1">
            {streaming ? (
              <button
                type="button"
                onClick={stop}
                className="h-9 w-9 grid place-items-center rounded-md border border-border hover:bg-accent/40"
                aria-label="Stop"
                data-testid={AI.stop}
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!input.trim()}
                className="h-9 w-9 grid place-items-center rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white disabled:opacity-50"
                aria-label="Send"
                data-testid={AI.send}
              >
                {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
