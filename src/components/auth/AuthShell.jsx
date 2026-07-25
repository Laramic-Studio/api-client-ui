import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { StackedLogo } from "@/components/layout/stack-logo";
import { Marquee } from "@/components/ui/marquee";

const REVIEWS = [
  {
    name: "Maya Chen",
    username: "@mayachen",
    body: "Finally an API client that feels fast. Collections, envs, and Echo in one place.",
    img: "https://avatar.vercel.sh/maya",
  },
  {
    name: "Jordan Lee",
    username: "@jordanlee",
    body: "Switched our team from Postman in a week. Sync just works.",
    img: "https://avatar.vercel.sh/jordan",
  },
  {
    name: "Priya Nair",
    username: "@priyan",
    body: "The request builder is clean. Variables and secrets stopped being a mess.",
    img: "https://avatar.vercel.sh/priya",
  },
  {
    name: "Alex Rivera",
    username: "@arivera",
    body: "Desktop + web in sync is underrated. I ship from either without thinking.",
    img: "https://avatar.vercel.sh/alex",
  },
  {
    name: "Sam Okonkwo",
    username: "@samoko",
    body: "Echo explaining a failing response saved me an hour of digging.",
    img: "https://avatar.vercel.sh/sam",
  },
  {
    name: "Elena Vogt",
    username: "@elenav",
    body: "Team workspaces without the bloat. Exactly what we needed.",
    img: "https://avatar.vercel.sh/elena",
  },
  {
    name: "Chris Park",
    username: "@cpark",
    body: "Import was painless. Our whole collection landed intact.",
    img: "https://avatar.vercel.sh/chris",
  },
  {
    name: "Nina Solis",
    username: "@ninas",
    body: "Feels modern without getting in the way. I open it every day.",
    img: "https://avatar.vercel.sh/nina",
  },
];

const reviewRows = [
  REVIEWS.slice(0, 3),
  REVIEWS.slice(3, 6),
  REVIEWS.slice(5, 8),
  [...REVIEWS.slice(0, 2), ...REVIEWS.slice(6, 8)],
];

function ReviewCard({ img, name, username, body }) {
  return (
    <figure
      className={cn(
        "relative w-64 shrink-0 overflow-hidden rounded-xl border border-border bg-card/80 p-4",
        "backdrop-blur-sm",
      )}
    >
      <div className="flex items-center gap-2.5">
        <img
          className="h-8 w-8 rounded-full"
          width={32}
          height={32}
          alt=""
          src={img}
        />
        <div className="min-w-0 flex-1">
          <figcaption className="truncate text-sm font-medium text-foreground">
            {name}
          </figcaption>
          <p className="truncate text-xs text-muted-foreground">{username}</p>
        </div>
      </div>
      <blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {body}
      </blockquote>
    </figure>
  );
}

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
    <aside className="relative hidden overflow-hidden bg-background lg:block">
      <div className="absolute inset-0 flex flex-col justify-center gap-2 py-8">
        {reviewRows.map((row, index) => (
          <Marquee
            key={index}
            pauseOnHover
            reverse={index % 2 === 1}
            className="[--duration:45s]"
          >
            {row.map((review) => (
              <ReviewCard key={`${index}-${review.username}`} {...review} />
            ))}
          </Marquee>
        ))}
      </div>
      {/* Circular vignette — soft oval fade so the marquee reads as covered by the background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 48% 42% at 50% 50%, transparent 0%, transparent 42%, hsl(var(--background) / 0.55) 68%, hsl(var(--background)) 100%)",
        }}
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
