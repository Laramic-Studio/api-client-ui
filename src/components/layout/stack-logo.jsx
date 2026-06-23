import { cn } from "@/lib/utils";

/** Static SVG logo — 3 stacked rectangles, solid fill, compact */
export function StackedLogo({ size = 16, color = "currentColor", animated = false, className, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(animated && "echo-logo-animated", className)}
      style={style}
      aria-hidden
    >
      <rect className="echo-logo-bar echo-logo-bar-1" x="3" y="1.5" width="10" height="3.5" rx="0.5" fill={color} />
      <rect className="echo-logo-bar echo-logo-bar-2" x="4.5" y="6.5" width="10" height="3.5" rx="0.5" fill={color} />
      <rect className="echo-logo-bar echo-logo-bar-3" x="2" y="11.5" width="10" height="3.5" rx="0.5" fill={color} />
    </svg>
  );
}
