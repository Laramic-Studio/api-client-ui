import { cn } from "@/lib/utils";

export const authInputClass =
  "h-11 rounded-lg border-zinc-200 bg-white text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:ring-zinc-300";

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
          <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-800">
            {label}
            {required && <span className="text-zinc-500">*</span>}
          </label>
          {labelExtra}
        </div>
      )}
      <div className="relative">
        {error && (
          <div
            role="alert"
            className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white shadow-lg"
          >
            {error}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
          </div>
        )}
        {children}
      </div>
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
