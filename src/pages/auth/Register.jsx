import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import SocialButtons from "@/components/auth/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/useAppStore";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";

export default function Register() {
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      login({ name, email, provider: "password" });
      setLoading(false);
      toast.success("Account created — let's set things up");
      navigate("/onboarding", { replace: true });
    }, 400);
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Spin up your developer workspace in seconds."
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
            placeholder="ada@noidr.dev"
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
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          data-testid={AUTH.registerSubmit}
          className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground font-medium"
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
