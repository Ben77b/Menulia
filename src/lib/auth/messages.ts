import type { AuthError } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";

type AuthLikeError = AuthError | PostgrestError | Error;

export function toFriendlyAuthError(error: AuthLikeError | unknown): string {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return "We could not sign you in. Please verify your credentials and try again.";
  }

  const message = String(error.message).toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }

  if (message.includes("email not confirmed")) {
    return "Please confirm your email address before logging in.";
  }

  if (
    message.includes("session could not be established") ||
    message.includes("session could not be verified") ||
    message.includes("session could not be started")
  ) {
    return "Your session could not be started. Please try again.";
  }

  if (message.includes("fetch") || message.includes("network")) {
    return "We could not reach the authentication service. Check your connection and try again.";
  }

  return "We could not sign you in. Please verify your credentials and try again.";
}

export function logAuthDiagnostic(
  scope: string,
  error: AuthError | PostgrestError | Error | unknown
): void {
  console.error(`[auth:${scope}]`);
  console.dir(error, { depth: null });

  if (error && typeof error === "object") {
    const record = error as AuthError & PostgrestError;
    console.error(`[auth:${scope}:summary]`, {
      message: record.message,
      details: record.details,
      hint: record.hint,
      code: record.code,
      status: record.status,
    });
  }
}
