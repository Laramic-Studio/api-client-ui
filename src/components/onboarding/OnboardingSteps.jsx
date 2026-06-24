import { cn } from "@/lib/utils";

export default function OnboardingSteps({ current, total = 3 }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            step <= current ? "bg-[hsl(var(--brand))]" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}
