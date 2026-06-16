import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import SocialButtons from "@/components/auth/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authDestination } from "@/lib/auth/routes";
import { getErrorMessage, useRegister } from "@/hooks/use-auth";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";

export default function Register() {
  const register = useRegister();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("All fields are required");
      return;
    }
    if (password !== password2) {
      toast.error("Passwords don't match");
      return;
    }

    register.mutate(
      { name, email, password, password_confirmation: password2 },
      {
        onSuccess: (user) => {
          toast.success("Account created — check your email for a verification code");
          navigate(authDestination(user), { replace: true });
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Could not create account."));
        },
      },
    );
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Your workspace on app.noidr.dev — powered by the NoIDR API."
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/login" className="text-[hsl(var(--brand))] hover:underline" data-testid={AUTH.registerToLogin}>
            Sign in
          </Link>
        </span>
      }
    >
      <SocialButtons />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[12px] text-foreground/85 uppercase tracking-wider font-mono">Full name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid={AUTH.registerName}
            className="bg-muted border-border h-10 font-mono text-[13px]"
            placeholder="Ada Lovelace"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] text-foreground/85 uppercase tracking-wider font-mono">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid={AUTH.registerEmail}
            className="bg-muted border-border h-10 font-mono text-[13px]"
            placeholder="ada@example.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] text-foreground/85 uppercase tracking-wider font-mono">Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid={AUTH.registerPassword}
            className="bg-muted border-border h-10 font-mono text-[13px]"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] text-foreground/85 uppercase tracking-wider font-mono">Confirm password</Label>
          <Input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="bg-muted border-border h-10 font-mono text-[13px]"
            autoComplete="new-password"
          />
        </div>
        <Button
          type="submit"
          disabled={register.isPending}
          data-testid={AUTH.registerSubmit}
          className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white font-medium"
        >
          {register.isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
