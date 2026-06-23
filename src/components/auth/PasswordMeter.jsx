import { cn } from "@/lib/utils";

const LEVELS = [
  { label: "Too weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Fair", bar: "bg-[hsl(var(--warning))]", text: "text-[hsl(var(--warning))]" },
  { label: "Good", bar: "bg-[hsl(var(--brand))]", text: "text-[hsl(var(--brand))]" },
  { label: "Strong", bar: "bg-[hsl(var(--success))]", text: "text-[hsl(var(--success))]" },
];

export function scorePassword(password) {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (password.length < 8) return 1;
  if (score <= 2) return 1;
  if (score === 3) return 2;
  if (score === 4) return 3;
  return 4;
}

export default function PasswordMeter({ password, className }) {
  const level = scorePassword(password);

  if (!password) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Must be at least 8 characters.
      </p>
    );
  }

  const { label, bar, text } = LEVELS[level - 1];

  return (
    <div className={cn("space-y-2", className)} aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" role="meter" aria-valuenow={level} aria-valuemin={1} aria-valuemax={4} aria-label={`Password strength: ${label}`}>
          {LEVELS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-200",
                i < level ? bar : "bg-border",
              )}
            />
          ))}
        </div>
        <span className={cn("text-xs font-medium tabular-nums", text)}>{label}</span>
      </div>
      {/* <ul className="space-y-0.5 text-xs text-muted-foreground">
        <Requirement met={password.length >= 8}>At least 8 characters</Requirement>
        <Requirement met={password.length >= 12}>12+ characters for extra strength</Requirement>
        <Requirement met={/[a-z]/.test(password) && /[A-Z]/.test(password)}>Upper & lower case</Requirement>
        <Requirement met={/\d/.test(password)}>Includes a number</Requirement>
        <Requirement met={/[^a-zA-Z0-9]/.test(password)}>Includes a symbol</Requirement>
      </ul> */}
    </div>
  );
}

function Requirement({ met, children }) {
  return (
    <li className={cn("transition-colors", met && "text-[hsl(var(--success))]")}>
      {met ? "✓" : "·"} {children}
    </li>
  );
}
