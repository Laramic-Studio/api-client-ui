import { cn } from "@/lib/utils";

/** Status text with animated ellipsis — logo animates on the message avatar instead */
export default function EchoThinking({ label = "Echo is thinking", className }) {
  const text = String(label || "Echo is thinking").replace(/[.\u2026]+$/u, "").trim();

  return (
    <span className={cn("text-[13px] text-white", className)}>
      {text}
      <span className="echo-thinking-dots" aria-hidden="true">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </span>
  );
}
