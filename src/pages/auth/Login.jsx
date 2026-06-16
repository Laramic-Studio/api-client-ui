import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import SocialButtons from "@/components/auth/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          if (process.env.NODE_ENV === "development") {
            console.error("[auth/login]", err);
          }
        },
      },
    );
  };

  return (
    <AuthShell
      title="Sign in to Noidr"
      subtitle="Sign in with your NoIDR account."
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-[hsl(var(--brand))] hover:underline" data-testid={AUTH.loginToRegister}>
            Create one
          </Link>
        </span>
      }
    >
      <SocialButtons />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[12px] text-foreground/85 uppercase tracking-wider font-mono">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid={AUTH.loginEmail}
            className="bg-muted border-[hsl(var(--border))] h-10 font-mono text-[13px]"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[12px] text-foreground/85 uppercase tracking-wider font-mono">Password</Label>
            <Link to="/forgot-password" className="text-[12px] text-muted-foreground hover:text-foreground" data-testid={AUTH.loginForgot}>
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid={AUTH.loginPassword}
            className="bg-muted border-[hsl(var(--border))] h-10 font-mono text-[13px]"
            autoComplete="current-password"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={remember}
            onCheckedChange={(v) => setRemember(Boolean(v))}
            data-testid={AUTH.loginRemember}
            className="border-[hsl(var(--border))]"
          />
          <span className="text-[13px] text-foreground/85">Remember me for 30 days</span>
        </label>
        <Button
          type="submit"
          disabled={login.isPending}
          data-testid={AUTH.loginSubmit}
          className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white font-medium"
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
