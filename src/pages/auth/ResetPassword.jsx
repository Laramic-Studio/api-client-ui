import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell, { AuthBackLink } from "@/components/auth/AuthShell";
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
      <AuthShell>
        <AuthBackLink to="/forgot-password">Request a new link</AuthBackLink>

        <div>
          <h1 className="text-2xl font-medium tracking-tight">Invalid reset link</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            This link is missing a token or has expired.
          </p>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Open the reset link from your email, or request a new one.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthBackLink to="/login">Back to sign in</AuthBackLink>

      <div>
        <h1 className="text-2xl font-medium tracking-tight">Set a new password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Resetting for {email}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
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
