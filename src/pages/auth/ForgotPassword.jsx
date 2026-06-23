import { useState } from "react";
import AuthShell, { AuthLink } from "@/components/auth/AuthShell";
import AuthField, { authInputClass } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      title="Forgot password?"
      subtitle="We'll email you a link to reset your password."
      backTo="/login"
      backLabel="Back to sign in"
    >
      {sent ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          If an account exists for <span className="font-medium text-zinc-900">{email}</span>, a reset link is on its way.
          <div className="mt-3">
            <AuthLink to="/login">Back to sign in →</AuthLink>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <AuthField label="Email" required htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid={AUTH.forgotEmail}
              className={authInputClass}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </AuthField>
          <Button
            type="submit"
            disabled={forgotPassword.isPending}
            data-testid={AUTH.forgotSubmit}
            className="h-11 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {forgotPassword.isPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
