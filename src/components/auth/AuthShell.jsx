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
      className={cn("font-semibold text-zinc-900 hover:underline", className)}
      {...props}
    >
      {children}
    </Link>
  );
}

function AuthBrand() {
  return (
    <Link to="/" className="inline-flex shrink-0" aria-label="Noidr home">
      <div className="grid h-8 w-8 place-items-center rounded-md bg-zinc-900">
        <StackedLogo size={16} color="#fff" />
      </div>
    </Link>
  );
}

function HeroPanel() {
  return (
    <aside className="relative hidden overflow-hidden lg:block">
      <img
        src={HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover grayscale"
      />
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 flex items-center justify-center">
        <StackedLogo size={112} color="#fff" className="drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]" />
      </div>
    </aside>
  );
}

function LegalFooter() {
  const year = new Date().getFullYear();

  return (
    <div className="mt-auto flex items-center justify-between gap-4 pt-10 text-xs text-zinc-400">
      <span>© Noidr {year}</span>
      <a
        href="mailto:support@noidr.dev"
        className="inline-flex items-center gap-1.5 hover:text-zinc-600 transition-colors"
      >
        <Mail className="h-3.5 w-3.5" />
        support@noidr.dev
      </a>
    </div>
  );
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  backTo,
  backLabel = "Back",
}) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-white text-zinc-950 lg:grid-cols-2">
      <div className="flex min-h-screen  flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        {backTo ? (
          <AuthLink
            to={backTo}
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-normal text-zinc-500 no-underline hover:text-zinc-800 hover:no-underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </AuthLink>
        ) : (
          <AuthBrand />
        )}

        <div className="flex flex-1 flex-col justify-center py-8 lg:py-12">
          <div className="mx-auto w-full max-w-[400px] anim-fade-up lg:mx-0">
            <header className="mb-8">
              <h1 className="text-[2rem] font-semibold tracking-tight text-zinc-900">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
              )}
            </header>

            <div className="space-y-6">{children}</div>

            {footer && (
              <p className="mt-8 text-center text-sm text-zinc-500 lg:text-left">{footer}</p>
            )}
          </div>
        </div>

        <LegalFooter />
      </div>

      <HeroPanel />
    </div>
  );
}
