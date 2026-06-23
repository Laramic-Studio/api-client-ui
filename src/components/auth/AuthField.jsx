import { cn } from "@/lib/utils";

export const authInputClass =
  "h-11 rounded-lg border-border bg-input text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-[hsl(var(--brand))]";

export const authButtonClass =
  "h-11 w-full rounded-lg bg-[hsl(var(--brand))] text-sm font-medium text-[hsl(var(--brand-foreground))] hover:bg-[hsl(var(--brand))]/90";

export default function AuthField({
  label,
  required = false,
  error,
  hint,
  htmlFor,
  labelExtra,
  children,
  className,
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-muted-foreground">*</span>}
          </label>
          {labelExtra}
        </div>
      )}
      <div className="relative">
        {error && (
          <div
            role="alert"
            className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-lg"
          >
            {error}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
          </div>
        )}
        {children}
      </div>
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
