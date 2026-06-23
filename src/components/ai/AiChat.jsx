import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Send, Sparkles, Square } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useAiChat } from "@/hooks/use-ai-chat";
import { pageSuggestions } from "@/lib/ai/context";
import AiMessage from "@/components/ai/AiMessage";
import { AI } from "@/constants/testIds";

const INPUT_MIN_HEIGHT = 88;
const INPUT_MAX_HEIGHT = 220;

export default function AiChat() {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const prefillHandled = useRef(0);
  const location = useLocation();
  const ai = useAppStore((s) => s.aiSettings);
  const messages = useAppStore((s) => s.aiMessages);
  const aiChatPrefill = useAppStore((s) => s.aiChatPrefill);
  const aiChatAutoSend = useAppStore((s) => s.aiChatAutoSend);
  const aiChatPrefillToken = useAppStore((s) => s.aiChatPrefillToken);
  const clearAiChatPrefill = useAppStore((s) => s.clearAiChatPrefill);
  const {
    send,
    stop,
    isBusy,
    runningActionId,
    runAction,
    dismissAction,
  } = useAiChat();

  const suggestions = pageSuggestions(location.pathname);

  const resizeInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, INPUT_MIN_HEIGHT), INPUT_MAX_HEIGHT);
    el.style.height = `${next}px`;
  };

  useEffect(() => {
    resizeInput();
  }, [input]);

  useEffect(() => {
    if (!aiChatPrefill || !aiChatPrefillToken || prefillHandled.current === aiChatPrefillToken) return;
    if (aiChatAutoSend && isBusy) return;
    prefillHandled.current = aiChatPrefillToken;
    setInput(aiChatPrefill);
    clearAiChatPrefill();
    if (aiChatAutoSend) {
      send(aiChatPrefill);
    }
  }, [aiChatPrefill, aiChatPrefillToken, aiChatAutoSend, clearAiChatPrefill, send, isBusy]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBusy]);

  const submit = async () => {
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    await send(text);
  };

  return (
    <div className="flex flex-col h-full min-h-0" data-testid={AI.chat}>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="p-3 space-y-4">
          {messages.length === 0 && (
            <div className="py-8 px-2 text-center space-y-3">
              <Sparkles className="h-8 w-8 mx-auto text-[hsl(var(--brand))]/70" />
              <div className="text-[13.5px] font-medium">Echo</div>
              <div className="text-[12px] text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
                I know this page and your workspace. Ask anything — I&apos;ll propose actions for you to run.
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInput(s)}
                    disabled={isBusy}
                    className="px-2 py-1 rounded border border-border text-[11px] text-muted-foreground hover:bg-accent/40 hover:text-foreground/85 disabled:opacity-50"
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
      </div>

      <div className="shrink-0 border-t border-border bg-background relative">
        <div className="absolute truncate left-3 bottom-3 text-[10px] font-rowdies uppercase tracking-wider text-muted-foreground pointer-events-none z-10">
          <span className="truncate ">{ai.provider}/{ai.model}</span>
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={isBusy ? "Echo is working…" : "Ask Echo anything…"}
          disabled={isBusy}
          data-testid={AI.input}
          rows={3}
          className="block w-full resize-none border-none bg-muted py-3 pl-4 pr-14 text-[13px] leading-relaxed focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 overflow-y-auto"
          style={{ minHeight: INPUT_MIN_HEIGHT, maxHeight: INPUT_MAX_HEIGHT }}
        />

        <div className="absolute right-3 bottom-3 z-20">
          {isBusy ? (
            <button
              type="button"
              onClick={stop}
              className="h-9 w-9 grid place-items-center rounded-md border border-border hover:bg-accent/40 bg-background"
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
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
