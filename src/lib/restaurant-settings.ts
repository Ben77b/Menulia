import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { compileHoursSchedule, type HoursScheduleBlock } from "./hours-schedule";
import { formatContactInfo } from "./contact-info";
import {
  CUSTOM_LINKS_SQL_HINT,
  parseCustomLinks,
  serializeCustomLinks,
  type RestaurantLink,
  type RestaurantLinkInput,
} from "./restaurant-links";

export interface RestaurantSettingsForm {
  name: string;
  slug: string;
  originalSlug: string;
  location: string;
  phone: string;
  email: string;
  scheduleBlocks: HoursScheduleBlock[];
  footerSlogan: string;
  links: RestaurantLinkInput[];
}

export interface RestaurantSettingsRecord {
  name: string;
  slug: string;
  location: string;
  hours: string;
  contact_info: string;
  footer_slogan: string;
  custom_links: RestaurantLink[];
}

const EXTENDED_PROFILE_COLUMNS =
  "id, name, slug, location, hours, contact_info, footer_slogan, custom_links" as const;

const CORE_PROFILE_COLUMNS = "id, name, slug, location, hours, contact_info" as const;

export function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = String((error as PostgrestError).code ?? "");
  return code === "PGRST204" || code === "42703";
}

export function formatSchemaError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Failed to load restaurant settings.";
  }

  const postgrestError = error as PostgrestError;
  const message = postgrestError.message ?? "Unknown database error";

  if (isMissingColumnError(error)) {
    const match = message.match(/column\s+[\w.]+\.(\w+)\s+does not exist/i);
    const column = match?.[1];

    if (column === "custom_links" || column === "footer_slogan") {
      return `Your database is missing the "${column}" column. ${CUSTOM_LINKS_SQL_HINT}`;
    }

    if (column) {
      return `Your database is missing the "${column}" column on restaurants. Run supabase/migrations/20250629000000_restaurant_profile_columns.sql in the Supabase SQL editor, then refresh this page.`;
    }

    return `Database schema is out of date (${message}). ${CUSTOM_LINKS_SQL_HINT}`;
  }

  return message;
}

export function missingColumnMessage(): string {
  return formatSchemaError({
    code: "42703",
    message: "column restaurants.location does not exist",
  } as PostgrestError);
}

export async function loadRestaurantSettings(
  supabase: SupabaseClient,
  restaurantId: string
): Promise<RestaurantSettingsRecord> {
  const { data, error } = await supabase
    .from("restaurants")
    .select(EXTENDED_PROFILE_COLUMNS)
    .eq("id", restaurantId)
    .single();

  if (error) {
    if (isMissingColumnError(error)) {
      const { data: coreData, error: coreError } = await supabase
        .from("restaurants")
        .select(CORE_PROFILE_COLUMNS)
        .eq("id", restaurantId)
        .single();

      if (coreError) {
        throw new Error(formatSchemaError(coreError));
      }

      if (!coreData) {
        throw new Error("Restaurant not found.");
      }

      return {
        name: coreData.name ?? "",
        slug: typeof coreData.slug === "string" ? coreData.slug : "",
        location: coreData.location ?? "",
        hours: coreData.hours ?? "",
        contact_info: coreData.contact_info ?? "",
        footer_slogan: "",
        custom_links: [],
      };
    }

    throw new Error(formatSchemaError(error));
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
    custom_links: parseCustomLinks(data.custom_links),
  };
}

export function buildRestaurantSettingsPayload(form: RestaurantSettingsForm): {
  name: string;
  location: string;
  hours: string;
  contact_info: string;
  footer_slogan: string;
  custom_links: ReturnType<typeof serializeCustomLinks>;
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
    footer_slogan: string;
    custom_links: ReturnType<typeof serializeCustomLinks>;
    updated_at: string;
    slug?: string;
  } = {
    name: form.name.trim(),
    location: form.location.trim(),
    hours: compileHoursSchedule(form.scheduleBlocks),
    contact_info: formatContactInfo(form.phone, form.email),
    footer_slogan: form.footerSlogan.trim(),
    custom_links: serializeCustomLinks(form.links),
    updated_at: new Date().toISOString(),
  };

  if (!slugUnchanged) {
    payload.slug = normalizedSlug;
  }

  return payload;
}

export async function saveFullRestaurantSettings(
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
    throw new Error(formatSchemaError(error));
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
