import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthShell from "@/components/auth/AuthShell";
import {
  buildDesktopDeepLink,
  isLoopbackRedirect,
} from "@/lib/auth/desktop-flow";

export default function DesktopReturn() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "";
  const state = searchParams.get("state") || "";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const deepLinkUrl =
    code && redirectUri ? buildDesktopDeepLink(redirectUri, code, state) : "";
  const usesLoopback = redirectUri ? isLoopbackRedirect(redirectUri) : false;

  useEffect(() => {
    if (!deepLinkUrl) return undefined;
    const timer = window.setTimeout(() => {
      window.location.href = deepLinkUrl;
    }, 600);
    return () => window.clearTimeout(timer);
  }, [deepLinkUrl]);

  if (!deepLinkUrl) {
    return (
      <AuthShell>
        <div className="text-center">
          <h1 className="text-2xl font-medium tracking-tight">Missing sign-in details</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Open Noidr Desktop and try signing in again.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          Signed in successfully
        </div>

        <p className="text-sm text-muted-foreground">
          {usesLoopback ? (
            <>
              Click below to send your sign-in back to the Noidr desktop app. Keep the desktop app
              open while you do this.
            </>
          ) : (
            <>
              Return to the Noidr desktop app to finish signing in. If your browser asks to open
              Noidr, choose <strong className="text-foreground">Allow</strong>.
            </>
          )}
        </p>

        <Button asChild className="h-11 w-full">
          <a href={deepLinkUrl}>
            {usesLoopback ? "Complete sign-in in Noidr" : "Open Noidr"}
          </a>
        </Button>

        <p className="text-xs text-muted-foreground">
          {usesLoopback
            ? "You should see a confirmation page, then switch back to the desktop app."
            : "Nothing happened? Click the button above, then switch back to the desktop app."}
        </p>
      </div>
    </AuthShell>
  );
}
