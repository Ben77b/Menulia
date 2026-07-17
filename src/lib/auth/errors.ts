import type { PostgrestError } from "@supabase/supabase-js";

export class RestaurantCreationError extends Error {
  readonly code: string;
  readonly details: string;
  readonly hint: string;

  constructor(error: PostgrestError, scope: string) {
    const code = error.code ?? "unknown";
    const details = error.details ?? "No additional details provided.";
    const hint = error.hint ?? "";
    const message = error.message ?? "Restaurant creation failed.";

    super(`[${scope}] ${code}: ${message} (${details})`);
    this.name = "RestaurantCreationError";
    this.code = code;
    this.details = details;
    this.hint = hint;
  }

  toDisplayMessage(): string {
    const parts = [
      `Error ${this.code}: ${this.message.replace(/^\[[^\]]+\]\s*/, "")}`,
      this.details ? `Details: ${this.details}` : null,
      this.hint ? `Hint: ${this.hint}` : null,
    ].filter(Boolean);

    return parts.join(" ");
  }
}

export function logSupabaseFailure(scope: string, error: PostgrestError | Error | unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const supabaseError = error as PostgrestError;
    console.error(`[${scope}]`, {
      message: supabaseError.message,
      details: supabaseError.details,
      hint: supabaseError.hint,
      code: supabaseError.code,
    });
    return;
  }

  console.error(`[${scope}]`, error);
}

export function formatSupabaseError(error: unknown): string {
  if (!error) return "Unknown error";

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const supabaseError = error as PostgrestError;
    return [supabaseError.message, supabaseError.details, supabaseError.hint, supabaseError.code]
      .filter(Boolean)
      .join(" — ");
  }

  return String(error);
}

export function getSupabaseErrorFields(error: unknown): {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
} {
  if (typeof error === "object" && error !== null && "message" in error) {
    const supabaseError = error as PostgrestError;
    return {
      code: supabaseError.code,
      message: supabaseError.message ?? formatSupabaseError(error),
      details: supabaseError.details,
      hint: supabaseError.hint,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: formatSupabaseError(error) };
}
