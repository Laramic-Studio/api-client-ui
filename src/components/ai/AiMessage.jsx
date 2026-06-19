import AiActionCard from "@/components/ai/AiActionCard";
import AiMarkdown from "@/components/ai/AiMarkdown";
import EchoCurrentStep from "@/components/ai/EchoSteps";
import { StackedLogo } from "@/components/layout/stack-logo";
import { truncatePromptForDisplay } from "@/lib/ai/format";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export default function AiMessage({ message, onRunAction, onDismissAction, runningActionId }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAssistant = !isUser && !isSystem;
  const content = message.content?.trim();
  const userDisplay = isUser
    ? (message.displayContent ?? truncatePromptForDisplay(content))
    : content;

  const showCurrentStep = isAssistant && message.currentStep && (message.processing || message.streaming || !content);
  const showContent = isAssistant
    ? content && !message.processing
    : Boolean(userDisplay);
  const isEchoWorking = isAssistant && (
    message.streaming
    || message.processing
    || message.currentStep?.status === "active"
  );

  if (isSystem) {
    return null;
  }

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
          <StackedLogo size={14} color="hsl(var(--brand))" animated={isEchoWorking} />
        )}
      </div>
      <div className={cn("min-w-0 flex-1 space-y-2", isUser && "text-right")}>
        {showCurrentStep && (
          <EchoCurrentStep step={message.currentStep} />
        )}
        {showContent && (
          <div
            className={cn(
              "inline-block max-w-full text-left rounded-md px-3 py-2",
              isUser && "bg-accent text-foreground/90 whitespace-pre-wrap break-words text-[13px] leading-relaxed",
              isAssistant && "bg-card border border-border text-foreground/90 w-full max-w-full overflow-hidden",
            )}
          >
            {isAssistant ? (
              <AiMarkdown content={content} />
            ) : (
              userDisplay
            )}
          </div>
        )}
        {!showCurrentStep && !showContent && message.proposedActions?.length > 0 && isAssistant && (
          <span className="text-[13px] text-muted-foreground">Preparing actions…</span>
        )}
        {!showCurrentStep && !showContent && isAssistant && !message.proposedActions?.length && message.streaming && (
          <span className="text-[13px] text-muted-foreground">No response.</span>
        )}
        {message.proposedActions?.length > 0 && !message.processing && (
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
