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
