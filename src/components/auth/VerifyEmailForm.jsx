import { REGEXP_ONLY_DIGITS } from "input-otp";
import { authButtonClass } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { AUTH } from "@/constants/testIds";
import { cn } from "@/lib/utils";

const OTP_SLOT_CLASS =
  "h-12 min-w-0 flex-1 rounded-lg border border-border bg-input text-base font-mono text-foreground shadow-none first:rounded-lg last:rounded-lg";

export default function VerifyEmailForm({
  code,
  onCodeChange,
  onSubmit,
  onComplete,
  onResend,
  isVerifying,
  isResending,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <InputOTP
        maxLength={6}
        value={code}
        onChange={onCodeChange}
        onComplete={onComplete}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        disabled={isVerifying}
        pasteTransformer={(pasted) => pasted.replace(/\D/g, "").slice(0, 6)}
        containerClassName="w-full gap-3"
        data-testid={AUTH.verifyOtp}
      >
        <InputOTPGroup className="flex flex-1 gap-2">
          <InputOTPSlot index={0} className={OTP_SLOT_CLASS} />
          <InputOTPSlot index={1} className={OTP_SLOT_CLASS} />
          <InputOTPSlot index={2} className={OTP_SLOT_CLASS} />
        </InputOTPGroup>
        <InputOTPSeparator className="shrink-0 text-muted-foreground" />
        <InputOTPGroup className="flex flex-1 gap-2">
          <InputOTPSlot index={3} className={OTP_SLOT_CLASS} />
          <InputOTPSlot index={4} className={OTP_SLOT_CLASS} />
          <InputOTPSlot index={5} className={OTP_SLOT_CLASS} />
        </InputOTPGroup>
      </InputOTP>

      <p className="text-start text-xs text-muted-foreground">
        Paste the full code — all 6 digits fill in automatically.
      </p>

      <Button
        type="submit"
        disabled={isVerifying || code.length !== 6}
        data-testid={AUTH.verifySubmit}
        className={authButtonClass}
      >
        {isVerifying ? "Verifying…" : "Verify email"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onResend}
          disabled={isResending || isVerifying}
          data-testid={AUTH.verifyResend}
          className={cn(
            "text-sm text-muted-foreground transition-colors hover:text-[hsl(var(--brand))]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isResending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </form>
  );
}
