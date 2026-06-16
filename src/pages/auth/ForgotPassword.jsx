import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, useForgotPassword } from "@/hooks/use-auth";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";

export default function ForgotPassword() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");

    forgotPassword.mutate(
      { email },
      {
        onSuccess: () => {
          setSent(true);
          toast.success("If that email exists, we sent a reset link.");
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Could not send reset link."));
        },
      },
    );
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll email you a link to reset your password."
      footer={<Link to="/login" className="text-[hsl(var(--brand))] hover:underline">← Back to sign in</Link>}
    >
      {sent ? (
        <div className="rounded-md border border-border bg-card p-4 text-[13px] text-foreground/85">
          If an account exists for <span className="text-foreground font-mono">{email}</span>, a reset link is on its way.
          <div className="mt-3">
            <Link to="/login" className="text-[hsl(var(--brand))] hover:underline">Back to sign in →</Link>
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
              autoComplete="email"
            />
          </div>
          <Button
            type="submit"
            disabled={forgotPassword.isPending}
            data-testid={AUTH.forgotSubmit}
            className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white font-medium"
          >
            {forgotPassword.isPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
