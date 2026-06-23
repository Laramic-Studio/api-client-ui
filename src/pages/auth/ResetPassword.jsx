import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import AuthField, { authButtonClass, authInputClass } from "@/components/auth/AuthField";
import PasswordInput from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import {
  toastAuthError,
  toastAuthSuccess,
  toastAuthValidation,
} from "@/lib/auth/toast";
import { useResetPassword } from "@/hooks/use-auth";
import { AUTH } from "@/constants/testIds";

export default function ResetPassword() {
  const resetPassword = useResetPassword();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");

  const hasToken = useMemo(() => Boolean(token && email), [token, email]);

  useEffect(() => {
    if (!hasToken) {
      toastAuthValidation("This reset link is invalid or has expired.");
    }
  }, [hasToken]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toastAuthValidation("Use at least 8 characters");
      return;
    }

    resetPassword.mutate(
      { token, email, password, password_confirmation: password },
      {
        onSuccess: () => {
          toastAuthSuccess("Password updated — sign in with your new password.");
          navigate("/login", { replace: true });
        },
        onError: (err) => {
          toastAuthError(err, "Could not reset password.");
        },
      },
    );
  };

  if (!hasToken) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This link is missing a token or has expired."
        backTo="/forgot-password"
        backLabel="Request a new link"
      >
        <p className="text-sm text-muted-foreground">
          Open the reset link from your email, or request a new one.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle={`Resetting for ${email}`}
      backTo="/login"
      backLabel="Back to sign in"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthField
          label="Password"
          required
          htmlFor="password"
          hint="Must be at least 8 characters."
        >
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid={AUTH.resetPassword}
            className={authInputClass}
            placeholder="Create a password"
            autoComplete="new-password"
          />
        </AuthField>
        <Button
          type="submit"
          disabled={resetPassword.isPending}
          data-testid={AUTH.resetSubmit}
          className={authButtonClass}
        >
          {resetPassword.isPending ? "Saving…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}
