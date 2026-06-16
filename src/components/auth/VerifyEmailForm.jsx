import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AUTH } from "@/constants/testIds";

export default function VerifyEmailForm({
  code,
  onCodeChange,
  onSubmit,
  onResend,
  isVerifying,
  isResending,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={onCodeChange}
          data-testid={AUTH.verifyOtp}
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="h-11 w-11 bg-muted border-border text-[15px] font-mono"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        type="submit"
        disabled={isVerifying || code.length !== 6}
        data-testid={AUTH.verifySubmit}
        className="w-full h-10 bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white font-medium"
      >
        {isVerifying ? "Verifying…" : "Verify email"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          data-testid={AUTH.verifyResend}
          className="text-[12.5px] text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {isResending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </form>
  );
}
