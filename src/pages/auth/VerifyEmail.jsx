import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";
import { useAppStore } from "@/store/useAppStore";
import { getAccessToken } from "@/lib/auth/tokens";
import { authDestination } from "@/lib/auth/routes";
import {
  toastAuthError,
  toastAuthSuccess,
  toastAuthValidation,
} from "@/lib/auth/toast";
import { useLogout, useResendVerification, useVerifyEmail } from "@/hooks/use-auth";

export default function VerifyEmail() {
  const user = useAppStore((s) => s.user);
  const verifyEmail = useVerifyEmail();
  const resend = useResendVerification();
  const logout = useLogout();
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const goToLogin = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate("/login", { replace: true }),
    });
  };

  const submitCode = (value) => {
    if (verifyEmail.isPending) return;

    const otp = value ?? code;
    if (otp.length !== 6) {
      toastAuthValidation("Enter the 6-digit code from your email");
      return;
    }

    verifyEmail.mutate(
      { code: otp },
      {
        onSuccess: () => {
          toastAuthSuccess("Email verified.");
          navigate(authDestination({ ...user, emailVerified: true }), { replace: true });
        },
        onError: (err) => toastAuthError(err, "Verification failed."),
      },
    );
  };

  const onSubmit = (e) => {
    e.preventDefault();
    submitCode(code);
  };

  const onComplete = (value) => {
    setCode(value);
    submitCode(value);
  };

  const onResend = () => {
    if (!getAccessToken()) {
      toastAuthValidation("Session expired. Please sign in again.");
      goToLogin();
      return;
    }

    resend.mutate(undefined, {
      onSuccess: () => toastAuthSuccess("A new code was sent to your email."),
      onError: (err) => {
        toastAuthError(err, "Could not resend code.");
        if (err?.status === 401) goToLogin();
      },
    });
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${user?.email || "your email"}.`}
      footer={
        <button
          type="button"
          onClick={goToLogin}
          disabled={logout.isPending}
          className="text-[hsl(var(--brand))] hover:underline disabled:opacity-50"
        >
          {logout.isPending ? "Signing out…" : "← Sign in with a different account"}
        </button>
      }
    >
      <VerifyEmailForm
        code={code}
        onCodeChange={setCode}
        onSubmit={onSubmit}
        onComplete={onComplete}
        onResend={onResend}
        isVerifying={verifyEmail.isPending}
        isResending={resend.isPending}
      />
    </AuthShell>
  );
}
