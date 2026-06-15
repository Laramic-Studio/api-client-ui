import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const onSubmit = (e) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");
    setSent(true);
    toast.success("Reset link sent (mock).");
  };
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll send a reset link to your email."
      footer={<Link to="/login" className="text-[hsl(var(--brand))] hover:underline">← Back to sign in</Link>}
    >
      {sent ? (
        <div className="rounded-md border border-border bg-card p-4 text-[13px] text-foreground/85">
          A reset link has been sent to <span className="text-foreground font-mono">{email}</span>.
          <div className="mt-3">
            <Link to="/reset-password" className="text-[hsl(var(--brand))] hover:underline">Continue to reset →</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-foreground/85 uppercase tracking-wider font-mono">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid={AUTH.forgotEmail}
              className="bg-muted border-border h-10 font-mono text-[13px]"
            />
          </div>
          <Button
            type="submit"
            data-testid={AUTH.forgotSubmit}
            className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground font-medium"
          >
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
