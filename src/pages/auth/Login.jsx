import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import AuthShell, { AuthLink } from "@/components/auth/AuthShell";
import AuthField, { authButtonClass, authInputClass } from "@/components/auth/AuthField";
import PasswordInput from "@/components/auth/PasswordInput";
import SocialButtons from "@/components/auth/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authDestination } from "@/lib/auth/routes";
import { inviteAcceptPath, storePendingInviteCode } from "@/lib/invite-flow";
import {
  toastAuthError,
  toastAuthSuccess,
  toastAuthValidation,
} from "@/lib/auth/toast";
import { useLogin } from "@/hooks/use-auth";
import { AUTH } from "@/constants/testIds";

export default function Login() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("invite_code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (inviteCode) storePendingInviteCode(inviteCode);
  }, [inviteCode]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toastAuthValidation("Please enter email and password");
      return;
    }

    login.mutate(
      { email, password, remember },
      {
        onSuccess: (user) => {
          toastAuthSuccess("Welcome back to Noidr");
          navigate(
            authDestination(user, location.state?.from ?? inviteAcceptPath(inviteCode)),
            { replace: true },
          );
        },
        onError: (err) => {
          toastAuthError(err, "Could not sign in. Try again.");
          if (import.meta.env.DEV) {
            console.error("[auth/login]", err);
          }
        },
      },
    );
  };

  return (
    <AuthShell>
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Sign in</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Welcome back.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <AuthField label="Email" required htmlFor="email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid={AUTH.loginEmail}
            className={authInputClass}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </AuthField>

        <AuthField
          label="Password"
          required
          htmlFor="password"
          labelExtra={
            <Link
              to="/forgot-password"
              className="text-xs font-normal text-muted-foreground hover:text-[hsl(var(--brand))]"
              data-testid={AUTH.loginForgot}
            >
              Forgot?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid={AUTH.loginPassword}
            className={authInputClass}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </AuthField>

        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={remember}
            onCheckedChange={(v) => setRemember(Boolean(v))}
            data-testid={AUTH.loginRemember}
            className="border-border data-[state=checked]:bg-[hsl(var(--brand))] data-[state=checked]:border-[hsl(var(--brand))]"
          />
          <span className="text-sm text-muted-foreground">Remember me for 30 days</span>
        </label>

        <Button
          type="submit"
          disabled={login.isPending}
          data-testid={AUTH.loginSubmit}
          className={authButtonClass}
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6">
        <SocialButtons variant="stacked" mode="signin" />
      </div>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <AuthLink to="/register" data-testid={AUTH.loginToRegister}>
          Sign up
        </AuthLink>
      </p>
    </AuthShell>
  );
}
