// Mock OAuth buttons for Login + Register. Creates a fake Google/GitHub
// account in LocalStorage with no real network round-trip.
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PROVIDERS = [
  {
    id: "google",
    label: "Continue with Google",
    testid: "auth-google-button",
    fakeEmail: () => `${["ada","alan","grace","linus","yuki"][Math.floor(Math.random()*5)]}@gmail.com`,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
    ),
  },
  {
    id: "github",
    label: "Continue with GitHub",
    testid: "auth-github-button",
    fakeEmail: () => `${["alex","noah","lila","kai","mia"][Math.floor(Math.random()*5)]}@users.noreply.github.com`,
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.02 1.74 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.17-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.93 10.93 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.73.8 1.17 1.82 1.17 3.07 0 4.4-2.69 5.36-5.25 5.65.41.35.77 1.03.77 2.08 0 1.5-.01 2.72-.01 3.09 0 .31.2.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
      </svg>
    ),
  },
];

export default function SocialButtons() {
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();

  const signIn = (provider) => {
    const email = provider.fakeEmail();
    login({ email, name: email.split("@")[0], provider: provider.id });
    toast.success(`Signed in via ${provider.id === "google" ? "Google" : "GitHub"}`);
    // New user → onboarding; we treat OAuth as new users for the prototype
    navigate("/onboarding");
  };

  return (
    <div className="space-y-2">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => signIn(p)}
          data-testid={p.testid}
          className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-md border border-[hsl(var(--border))] bg-card hover:bg-accent/40 text-[13px] font-medium"
        >
          {p.icon}
          {p.label}
        </button>
      ))}
      <div className="relative pt-3">
        <div className="absolute inset-x-0 top-1/2 h-px bg-[hsl(var(--border))]" />
        <div className="relative text-center">
          <span className="bg-background px-2 text-[11px] uppercase tracking-wider text-muted-foreground font-mono">or</span>
        </div>
      </div>
    </div>
  );
}
