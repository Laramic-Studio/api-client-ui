import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AUTH } from "@/constants/testIds";
import { toast } from "sonner";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const onVerify = () => {
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    toast.success("Email verified (mock).");
    setTimeout(() => navigate("/login"), 400);
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the 6-digit code sent to your inbox."
      footer={<Link to="/login" className="text-[hsl(var(--brand))] hover:underline">← Back to sign in</Link>}
    >
      <div className="space-y-5">
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup className="gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-12 w-11 rounded-md border-border bg-muted text-foreground text-lg font-mono"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <Button
          onClick={onVerify}
          data-testid={AUTH.verifySubmit}
          className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground font-medium"
        >
          Verify email
        </Button>
        <button className="text-[12px] text-muted-foreground hover:text-foreground" onClick={() => toast.message("Resent code (mock).")}>
          Didn&apos;t get the code? Resend
        </button>
      </div>
    </AuthShell>
  );
}
