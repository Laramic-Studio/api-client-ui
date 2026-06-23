import { toast } from "sonner";
import { ApiError } from "@/lib/api/http";
import { getErrorMessage } from "@/hooks/use-auth";

export function fieldError(err, field) {
  if (!(err instanceof ApiError)) return null;
  const messages = err.payload?.errors?.[field];
  if (Array.isArray(messages) && messages[0]) return messages[0];
  return null;
}

export function collectFieldErrors(err, fields) {
  return Object.fromEntries(
    fields
      .map((field) => [field, fieldError(err, field)])
      .filter(([, message]) => message),
  );
}

export function toastAuthSuccess(message) {
  toast.success(message);
}

export function toastAuthError(err, fallback, fieldErrors = {}) {
  const firstFieldMessage = Object.values(fieldErrors).find(Boolean);
  toast.error(firstFieldMessage || getErrorMessage(err, fallback));
}

export function toastAuthValidation(message) {
  toast.error(message);
}
