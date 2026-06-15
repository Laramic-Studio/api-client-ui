import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Use at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");
    toast.success("Password reset (mock). Please sign in.");
    setTimeout(() => navigate("/login"), 400);
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose something memorable but strong."
      footer={<Link to="/login" className="text-[hsl(var(--brand))] hover:underline">← Back to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[12px] text-foreground/85 uppercase tracking-wider font-mono">New password</Label>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            data-testid={AUTH.resetPassword}
            className="bg-muted border-border h-10 font-mono text-[13px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] text-foreground/85 uppercase tracking-wider font-mono">Confirm password</Label>
          <Input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className="bg-muted border-border h-10 font-mono text-[13px]"
          />
        </div>
        <Button
          type="submit"
          data-testid={AUTH.resetSubmit}
          className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground font-medium"
        >
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
