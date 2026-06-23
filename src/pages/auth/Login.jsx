import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthShell, { AuthLink } from "@/components/auth/AuthShell";
import AuthField, { authButtonClass, authInputClass } from "@/components/auth/AuthField";
import PasswordInput from "@/components/auth/PasswordInput";
import SocialButtons from "@/components/auth/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { authDestination } from "@/lib/auth/routes";
import { getErrorMessage, useLogin } from "@/hooks/use-auth";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";

export default function Login() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    login.mutate(
      { email, password, remember },
      {
        onSuccess: (user) => {
          toast.success("Welcome back to Noidr");
          navigate(authDestination(user, location.state?.from), { replace: true });
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Could not sign in. Try again."));
          if (import.meta.env.DEV) {
            console.error("[auth/login]", err);
          }
        },
      },
    );
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back."
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <AuthLink to="/register" data-testid={AUTH.loginToRegister}>
            Sign up
          </AuthLink>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
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

      <SocialButtons variant="stacked" mode="signin" />
    </AuthShell>
  );
}
