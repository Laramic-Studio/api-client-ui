import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { StackedLogo } from "../layout/stack-logo";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground overflow-auto">
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-sm anim-fade-up">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-[#6366F1] to-[#4F46E5] grid place-items-center">
              <StackedLogo />
            </div>
            <div className="text-base font-medium tracking-tight">
              noidr<span className="text-[hsl(var(--brand))]">.</span>web
            </div>
          </Link>
          <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-[13.5px] text-muted-foreground">{subtitle}</p>}
          <div className="mt-8 space-y-4">{children}</div>
          {footer && <div className="mt-8 text-[13px] text-muted-foreground">{footer}</div>}
        </div>
      </div>
      <div className={cn(
        "hidden lg:flex relative border-l border-border overflow-hidden",
        "bg-[radial-gradient(60%_60%_at_70%_30%,rgba(99,102,241,0.18),transparent_70%)]"
      )}>
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/60" />
        <div className="relative z-10 self-end p-12 max-w-md">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground ">// Noidr Web</div>
          <h2 className="mt-3 text-3xl font-medium tracking-tight leading-snug">
            Build, test, and ship APIs at the speed of thought.
          </h2>
          <p className="mt-4 text-[13.5px] text-muted-foreground">
            A Postman alternative crafted for developers who care about performance,
            privacy, and command-first workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
