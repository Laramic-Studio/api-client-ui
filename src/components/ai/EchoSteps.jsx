import { Check, Loader2, X } from "lucide-react";
import EchoThinking from "@/components/ai/EchoThinking";
import { cn } from "@/lib/utils";

/** Shows only the current in-progress step (replaces previous steps). */
export default function EchoCurrentStep({ step, className }) {
  if (!step?.label) return null;

  const isThinking = /thinking/i.test(step.label);
  const isActive = step.status === "active";

  if (isActive && isThinking) {
    return <EchoThinking label={step.label} className={className} />;
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-start gap-2 text-[13px] leading-snug">
        {isActive ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 mt-0.5 animate-spin text-[hsl(var(--brand))]" />
        ) : step.status === "error" ? (
          <X className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive" />
        ) : (
          <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
        )}
        <span
          className={cn(
            isActive && "text-foreground/85",
            step.status === "done" && "text-muted-foreground",
            step.status === "error" && "text-destructive",
          )}
        >
          {step.label}
        </span>
      </div>
      {step.detail && step.status === "done" && (
        <p className="pl-5 text-[12px] text-muted-foreground leading-snug">{step.detail}</p>
      )}
    </div>
  );
}
