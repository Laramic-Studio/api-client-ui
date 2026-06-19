import AiActionCard from "@/components/ai/AiActionCard";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

export default function AiMessage({ message, onRunAction, onDismissAction, runningActionId }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={cn("flex gap-2.5", isUser && "flex-row-reverse")}
      data-testid={`ai-message-${message.id}`}
    >
      <div
        className={cn(
          "h-7 w-7 shrink-0 rounded-md grid place-items-center",
          isUser ? "bg-accent" : "bg-[hsl(var(--brand))]/15",
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-foreground/80" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-[hsl(var(--brand))]" />
        )}
      </div>
      <div className={cn("min-w-0 flex-1 space-y-2", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block max-w-full text-left rounded-md px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap",
            isUser && "bg-accent text-foreground/90",
            !isUser && !isSystem && "bg-card border border-border text-foreground/90",
            isSystem && "bg-muted/50 text-muted-foreground text-[12px] italic border-0",
          )}
        >
          {(message.content && message.content.trim()) || (message.streaming ? "…" : message.proposedActions?.length ? "Preparing actions…" : "No response.")}
        </div>
        {message.proposedActions?.length > 0 && (
          <div className="space-y-2">
            {message.proposedActions.map((action) => (
              <AiActionCard
                key={action.id}
                action={action}
                running={runningActionId === action.id}
                onRun={onRunAction}
                onDismiss={onDismissAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
