import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { isMissingColumnError, missingColumnMessage } from "./restaurant-settings";

export const SLUG_UNIQUE_VIOLATION = "23505";

export function isSlugUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  const code = (error as PostgrestError).code;
  if (code !== SLUG_UNIQUE_VIOLATION) return false;

  const message = String((error as PostgrestError).message ?? "").toLowerCase();
  const details = String((error as PostgrestError).details ?? "").toLowerCase();
  return message.includes("slug") || details.includes("slug") || message.includes("unique");
}

export function slugCollisionMessage(): string {
  return "This URL slug is already taken. Please choose a different one.";
}

export async function isRestaurantSlugAvailable(
  supabase: SupabaseClient,
  slug: string,
  excludeRestaurantId: string
): Promise<boolean> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;

  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", normalized)
    .neq("id", excludeRestaurantId)
    .maybeSingle();

  if (error) throw error;
  return data === null;
}

export function formatRestaurantSettingsError(error: unknown): string {
  if (isMissingColumnError(error)) {
    return missingColumnMessage();
  }

  if (isSlugUniqueViolation(error)) {
    return slugCollisionMessage();
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as PostgrestError).message);
  }

  return "Failed to save settings. Please try again.";
}
