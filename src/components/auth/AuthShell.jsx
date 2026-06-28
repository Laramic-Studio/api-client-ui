import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { StackedLogo } from "@/components/layout/stack-logo";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=1400&q=80";

export function AuthLink({ to, children, className, ...props }) {
  return (
    <Link
      to={to}
      className={cn("font-semibold text-[hsl(var(--brand))] hover:underline", className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export function AuthBackLink({ to, children, className, ...props }) {
  return (
    <Link
      to={to}
      className={cn(
        "mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}

function AuthBrand() {
  return (
    <Link to="/" className="inline-flex shrink-0 gap-2" aria-label="Noidr home">
      <div className="grid h-8 w-8 place-items-center rounded-md bg-[hsl(var(--brand))] shadow-[0_0_20px_hsl(var(--brand)/0.35)]">
        <StackedLogo size={16} color="#fff" />
      </div>
      <span className="text-2xl font-bold">Noidr</span>
    </Link>
  );
}

function HeroPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-l border-border lg:block">
      <img
        src={HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover grayscale contrast-110"
      />
    </aside>
  );
}

function LegalFooter() {
  const year = new Date().getFullYear();

  return (
    <div className="flex w-full items-center justify-between gap-4 text-xs text-muted-foreground">
      <span>© Noidr {year}</span>
      <a
        href="mailto:support@noidr.dev"
        className="inline-flex items-center gap-1.5 transition-colors hover:text-[hsl(var(--brand))]"
      >
        <Mail className="h-3.5 w-3.5" />
        support@noidr.dev
      </a>
    </div>
  );
}

export default function AuthShell({ children }) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-background text-foreground lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div className="shrink-0">
          <AuthBrand />
        </div>

        <div className="flex flex-1 items-center py-8 lg:py-12">
          <div className="anim-fade-up mx-auto w-full max-w-sm">{children}</div>
        </div>

        <div className="shrink-0">
          <LegalFooter />
        </div>
      </div>

      <HeroPanel />
    </div>
  );
}
