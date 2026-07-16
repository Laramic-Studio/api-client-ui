import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import * as authApi from "@/lib/api/auth-api";
import { applySession } from "@/lib/api/session";
import { authDestination } from "@/lib/auth/routes";
import { completeDesktopHandoffIfNeeded } from "@/lib/auth/complete-desktop-handoff";
import { toastAuthError, toastAuthSuccess } from "@/lib/auth/toast";
import { authKeys } from "@/lib/api/query-keys";
import { useQueryClient } from "@tanstack/react-query";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("Working…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const error = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (error) {
      setStatus("Social sign-in failed");
      toastAuthError(null, "Social sign-in failed. Try again.");
      navigate("/login", { replace: true });
      return;
    }

    if (!code) {
      setStatus("Missing authorization code");
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const data = await authApi.exchangeOAuthCode({ code, state });
        const teams = await authApi.listTeams().catch(() => []);
        const user = applySession({ ...data, teams });
        queryClient.setQueryData(authKeys.session(), user);

        const desktopPath = await completeDesktopHandoffIfNeeded();
        if (desktopPath) {
          toastAuthSuccess("Signed in — returning to Noidr Desktop");
          navigate(desktopPath, { replace: true });
          return;
        }

        toastAuthSuccess("Welcome back to Noidr");
        navigate(authDestination(user), { replace: true });
      } catch (err) {
        setStatus("Could not complete sign-in");
        toastAuthError(err, "Could not complete social sign-in.");
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, queryClient, searchParams]);

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-2xl font-medium tracking-tight">{status}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Finishing authentication…</p>
      </div>
    </AuthShell>
  );
}
