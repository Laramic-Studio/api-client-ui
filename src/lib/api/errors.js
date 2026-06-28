import { ApiError } from "@/lib/api/http";

export function getErrorMessage(err, fallback = "Something went wrong.") {
  if (err instanceof ApiError) {
    if (err.message && err.message !== `Request failed (${err.status})`) {
      return err.message;
    }
    if (err.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (err.status === 401) {
      return err.message || "Please sign in again.";
    }
    return err.message || fallback;
  }

  if (err instanceof Error) return err.message;
  return fallback;
}
