import type { AuthError } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";

export function toFriendlyAuthError(error: AuthError | Error): string {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }

  if (message.includes("email not confirmed")) {
    return "Please confirm your email address before logging in.";
  }

  if (message.includes("session could not be established")) {
    return "Your session could not be started. Please try again.";
  }

  return "We could not sign you in. Please verify your credentials and try again.";
}

export function logAuthDiagnostic(scope: string, error: AuthError | PostgrestError | Error | unknown) {
  if (error && typeof error === "object") {
    const record = error as AuthError & PostgrestError;
    console.error(`[auth:${scope}]`, {
      message: record.message,
      details: record.details,
      hint: record.hint,
      code: record.code,
      status: record.status,
    });
    return;
  }

  console.error(`[auth:${scope}]`, error);
}
