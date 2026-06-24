import { cn } from "@/lib/utils";

const COLORS = {
  GET: "text-[#3B82F6]",
  POST: "text-[#22C55E]",
  PUT: "text-[#F59E0B]",
  PATCH: "text-[#EAB308]",
  DELETE: "text-[#EF4444]",
  OPTIONS: "text-[#8B5CF6]",
  HEAD: "text-[#64748B]",
  WS: "text-[#10B981]",
  SSE: "text-[#06B6D4]",
  GRPC: "text-[#A855F7]",
};

export default function MethodBadge({ method, className }) {
  return (
    <span
      className={cn(
        "inline-block font-urbanist text-[10.5px] font-semibold tracking-wider uppercase",
        COLORS[method] || "text-muted-foreground",
        className
      )}
    >
      {method}
    </span>
  );
}
