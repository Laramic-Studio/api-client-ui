import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell, { AuthLink } from "@/components/auth/AuthShell";
import AuthField, { authButtonClass, authInputClass } from "@/components/auth/AuthField";
import PasswordInput from "@/components/auth/PasswordInput";
import SocialButtons from "@/components/auth/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/http";
import { authDestination } from "@/lib/auth/routes";
import { getErrorMessage, useRegister } from "@/hooks/use-auth";
import { AUTH } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function fieldError(err, field) {
  if (!(err instanceof ApiError)) return null;
  const messages = err.payload?.errors?.[field];
  if (Array.isArray(messages) && messages[0]) return messages[0];
  return null;
}

export default function Register() {
  const register = useRegister();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const onSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    if (!name || !email || !password) {
      toast.error("All fields are required");
      return;
    }

    register.mutate(
      { name, email, password, password_confirmation: password },
      {
        onSuccess: (user) => {
          toast.success("Account created — check your email for a verification code");
          navigate(authDestination(user), { replace: true });
        },
        onError: (err) => {
          const next = {
            name: fieldError(err, "name"),
            email: fieldError(err, "email"),
            password: fieldError(err, "password"),
          };
          setErrors(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));

          if (!next.email && !next.name && !next.password) {
            toast.error(getErrorMessage(err, "Could not create account."));
          }
        },
      },
    );
  };

  return (
    <AuthShell
      title="Sign up"
      subtitle="Start building APIs with your team."
      footer={
        <span>
          Already have an account?{" "}
          <AuthLink to="/login" data-testid={AUTH.registerToLogin}>
            Log in
          </AuthLink>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
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
          hint="Must be at least 8 characters."
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

      <SocialButtons variant="stacked" mode="signup" />
    </AuthShell>
  );
}
