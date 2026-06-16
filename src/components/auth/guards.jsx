import { Navigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { getAccessToken } from "@/lib/auth/tokens";
import { authHomePath, userIsOnboarded, userIsVerified } from "@/lib/auth/user-state";
import { useAuthBootstrap } from "@/hooks/use-auth";

export function AuthBootstrapGate({ children }) {
  useAuthBootstrap();
  const bootstrapped = useAppStore((s) => s.authBootstrapped);

  if (!bootstrapped) {
    return (
      <div className="h-screen w-screen grid place-items-center bg-background text-muted-foreground text-[13px] font-mono">
        Loading…
      </div>
    );
  }

  return children;
}

export function ProtectedRoute({ children }) {
  const user = useAppStore((s) => s.user);
  const loc = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (!userIsVerified(user)) return <Navigate to="/verify-email" replace />;
  if (!userIsOnboarded(user)) return <Navigate to="/onboarding" replace />;

  return children;
}

export function PublicOnlyRoute({ children }) {
  const user = useAppStore((s) => s.user);

  if (!user) return children;
  if (userIsVerified(user) && userIsOnboarded(user)) return <Navigate to="/dashboard" replace />;
  if (userIsVerified(user)) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/verify-email" replace />;
}

export function VerifyEmailRoute({ children }) {
  const user = useAppStore((s) => s.user);
  const hasToken = Boolean(getAccessToken());

  if (!user || !hasToken) return <Navigate to="/login" replace />;
  if (userIsVerified(user)) return <Navigate to={authHomePath(user)} replace />;

  return children;
}

export function OnboardingRoute({ children }) {
  const user = useAppStore((s) => s.user);
  const hasToken = Boolean(getAccessToken());

  if (!user || !hasToken) return <Navigate to="/login" replace />;
  if (!userIsVerified(user)) return <Navigate to="/verify-email" replace />;
  if (userIsOnboarded(user)) return <Navigate to="/dashboard" replace />;

  return children;
}

export function CatchAllRedirect() {
  const user = useAppStore((s) => s.user);
  return <Navigate to={authHomePath(user)} replace />;
}
