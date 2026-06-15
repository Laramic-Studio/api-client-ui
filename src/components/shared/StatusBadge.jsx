import { cn } from "@/lib/utils";

export default function StatusBadge({ status, className }) {
  const color =
    status >= 500
      ? "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30"
      : status >= 400
      ? "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30"
      : status >= 300
      ? "text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30"
      : status >= 200
      ? "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30"
      : "text-muted-foreground bg-accent/50 border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-mono font-semibold",
        color,
        className
      )}
    >
      {status || "—"}
    </span>
  );
}
