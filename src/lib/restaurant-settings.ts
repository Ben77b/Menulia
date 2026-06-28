import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { compileHoursSchedule, type HoursScheduleBlock } from "./hours-schedule";
import { formatContactInfo } from "./contact-info";

export interface RestaurantSettingsForm {
  name: string;
  slug: string;
  originalSlug: string;
  location: string;
  phone: string;
  email: string;
  scheduleBlocks: HoursScheduleBlock[];
}

export interface RestaurantSettingsRecord {
  name: string;
  slug: string;
  location: string;
  hours: string;
  contact_info: string;
}

const PROFILE_COLUMNS =
  "id, name, slug, location, hours, contact_info, footer_slogan" as const;

export function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = String((error as PostgrestError).code ?? "");
  const message = String((error as PostgrestError).message ?? "").toLowerCase();
  return code === "PGRST204" || code === "42703" || message.includes("column");
}

export function missingColumnMessage(): string {
  return "Your database is missing profile columns (location, hours, contact_info). Run supabase/migrations/20250629000000_restaurant_profile_columns.sql in the Supabase SQL editor, then try again.";
}

export async function loadRestaurantSettings(
  supabase: SupabaseClient,
  restaurantId: string
): Promise<RestaurantSettingsRecord & { footer_slogan: string }> {
  const { data, error } = await supabase
    .from("restaurants")
    .select(PROFILE_COLUMNS)
    .eq("id", restaurantId)
    .single();

  if (error) {
    if (isMissingColumnError(error)) {
      throw new Error(missingColumnMessage());
    }
    throw error;
  }

  if (!data) {
    throw new Error("Restaurant not found.");
  }

  return {
    name: data.name ?? "",
    slug: typeof data.slug === "string" ? data.slug : "",
    location: data.location ?? "",
    hours: data.hours ?? "",
    contact_info: data.contact_info ?? "",
    footer_slogan: data.footer_slogan ?? "",
  };
}

export function buildRestaurantSettingsPayload(form: RestaurantSettingsForm): {
  name: string;
  location: string;
  hours: string;
  contact_info: string;
  updated_at: string;
  slug?: string;
} {
  const slugUnchanged = form.slug.trim() === form.originalSlug.trim();
  const normalizedSlug = form.slug.trim().toLowerCase();

  const payload: {
    name: string;
    location: string;
    hours: string;
    contact_info: string;
    updated_at: string;
    slug?: string;
  } = {
    name: form.name.trim(),
    location: form.location.trim(),
    hours: compileHoursSchedule(form.scheduleBlocks),
    contact_info: formatContactInfo(form.phone, form.email),
    updated_at: new Date().toISOString(),
  };

  if (!slugUnchanged) {
    payload.slug = normalizedSlug;
  }

  return payload;
}

export async function saveRestaurantSettings(
  supabase: SupabaseClient,
  restaurantId: string,
  form: RestaurantSettingsForm
): Promise<{ updatedId: string; normalizedSlug?: string; slugUnchanged: boolean }> {
  const slugUnchanged = form.slug.trim() === form.originalSlug.trim();
  const normalizedSlug = form.slug.trim().toLowerCase();
  const payload = buildRestaurantSettingsPayload(form);

  const { data, error } = await supabase
    .from("restaurants")
    .update(payload)
    .eq("id", restaurantId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error)) {
      throw new Error(missingColumnMessage());
    }
    throw error;
  }

  if (!data?.id) {
    throw new Error(
      "Save did not apply. Confirm you are signed in and this restaurant belongs to your account."
    );
  }

  return {
    updatedId: data.id,
    normalizedSlug: slugUnchanged ? undefined : normalizedSlug,
    slugUnchanged,
  };
}
