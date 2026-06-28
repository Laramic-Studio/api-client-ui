import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell, { AuthLink } from "@/components/auth/AuthShell";
import AuthField, { authButtonClass, authInputClass } from "@/components/auth/AuthField";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordMeter from "@/components/auth/PasswordMeter";
import SocialButtons from "@/components/auth/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authDestination } from "@/lib/auth/routes";
import { inviteAcceptPath, storePendingInviteCode } from "@/lib/invite-flow";
import { useInvitation } from "@/hooks/use-teams";
import {
  collectFieldErrors,
  toastAuthError,
  toastAuthSuccess,
  toastAuthValidation,
} from "@/lib/auth/toast";
import { useRegister } from "@/hooks/use-auth";
import { AUTH } from "@/constants/testIds";
import { cn } from "@/lib/utils";

export default function Register() {
  const register = useRegister();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("invite_code");
  const inviteQuery = useInvitation(inviteCode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (inviteCode) storePendingInviteCode(inviteCode);
  }, [inviteCode]);

  useEffect(() => {
    const invitedEmail = inviteQuery.data?.invitation?.email;
    if (invitedEmail && !email) {
      setEmail(invitedEmail);
    }
  }, [inviteQuery.data?.invitation?.email, email]);

  const onSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    if (!name || !email || !password) {
      toastAuthValidation("All fields are required");
      return;
    }

    if (password.length < 8) {
      toastAuthValidation("Password must be at least 8 characters");
      return;
    }

    register.mutate(
      { name, email, password, password_confirmation: password },
      {
        onSuccess: (user) => {
          toastAuthSuccess("Account created — check your email for a verification code");
          navigate(authDestination(user, inviteAcceptPath(inviteCode)), { replace: true });
        },
        onError: (err) => {
          const next = collectFieldErrors(err, ["name", "email", "password"]);
          setErrors(next);
          toastAuthError(err, "Could not create account.", next);
        },
      },
    );
  };

  return (
    <AuthShell>
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Sign up</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Start building APIs with your team.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <AuthField label="Name" required htmlFor="name" error={errors.name}>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid={AUTH.registerName}
            className={cn(authInputClass, errors.name && "border-red-500 focus-visible:ring-red-200")}
            placeholder="Enter your name"
            autoComplete="name"
          />
        </AuthField>

        <AuthField label="Email" required htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid={AUTH.registerEmail}
            className={cn(authInputClass, errors.email && "border-red-500 focus-visible:ring-red-200")}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </AuthField>

        <AuthField
          label="Password"
          required
          htmlFor="password"
          error={errors.password}
        >
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid={AUTH.registerPassword}
            className={cn(authInputClass, errors.password && "border-red-500 focus-visible:ring-red-200")}
            placeholder="Create a password"
            autoComplete="new-password"
          />
          <PasswordMeter password={password} className="mt-2" />
        </AuthField>

        <Button
          type="submit"
          disabled={register.isPending}
          data-testid={AUTH.registerSubmit}
          className={authButtonClass}
        >
          {register.isPending ? "Creating account…" : "Get started"}
        </Button>
      </form>

      <div className="mt-6">
        <SocialButtons variant="stacked" mode="signup" />
      </div>

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <AuthLink to="/login" data-testid={AUTH.registerToLogin}>
          Log in
        </AuthLink>
      </p>
    </AuthShell>
  );
}
