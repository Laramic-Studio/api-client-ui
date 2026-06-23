import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, useResetPassword } from "@/hooks/use-auth";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";

export default function ResetPassword() {
  const resetPassword = useResetPassword();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const hasToken = useMemo(() => Boolean(token && email), [token, email]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Use at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");

    resetPassword.mutate(
      { token, email, password: pw, password_confirmation: pw2 },
      {
        onSuccess: () => {
          toast.success("Password updated — sign in with your new password.");
          navigate("/login", { replace: true });
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Could not reset password."));
        },
      },
    );
  };

  if (!hasToken) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This link is missing a token or has expired."
        footer={<Link to="/forgot-password" className="text-[hsl(var(--brand))] hover:underline">Request a new link</Link>}
      >
        <p className="text-[13px] text-muted-foreground">
          Open the reset link from your email, or request a new one.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose something memorable but strong."
      footer={<Link to="/login" className="text-[hsl(var(--brand))] hover:underline">← Back to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="text-[12px] text-muted-foreground  truncate">
          Resetting for {email}
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] text-foreground/85 uppercase tracking-wider ">New password</Label>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            data-testid={AUTH.resetPassword}
            className="bg-muted border-border h-10  text-[13px]"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[12px] text-foreground/85 uppercase tracking-wider ">Confirm password</Label>
          <Input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className="bg-muted border-border h-10  text-[13px]"
            autoComplete="new-password"
          />
        </div>
        <Button
          type="submit"
          disabled={resetPassword.isPending}
          data-testid={AUTH.resetSubmit}
          className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white font-medium"
        >
          {resetPassword.isPending ? "Saving…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}
