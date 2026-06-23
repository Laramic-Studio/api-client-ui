import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthShell, { AuthLink } from "@/components/auth/AuthShell";
import AuthField, { authInputClass } from "@/components/auth/AuthField";
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
              className="text-xs font-normal text-zinc-500 hover:text-zinc-800"
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
            className="border-zinc-300 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900"
          />
          <span className="text-sm text-zinc-600">Remember me for 30 days</span>
        </label>

        <Button
          type="submit"
          disabled={login.isPending}
          data-testid={AUTH.loginSubmit}
          className="h-11 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <SocialButtons variant="stacked" mode="signin" />
    </AuthShell>
  );
}
