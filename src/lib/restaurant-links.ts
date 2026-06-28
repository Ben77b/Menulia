import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnonClient, getSupabaseBrowserClient } from "./supabase";
import { logSupabaseFailure } from "./auth/errors";
import { formatSchemaError, isMissingColumnError } from "./restaurant-settings";

export interface RestaurantLink {
  id: string;
  label: string;
  url: string;
  order_index: number;
}

export interface RestaurantLinkInput {
  label: string;
  url: string;
}

function normalizeLinks(links: RestaurantLinkInput[]): RestaurantLinkInput[] {
  return links
    .map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
    }))
    .filter((link) => link.label.length > 0 && link.url.length > 0);
}

function isMissingTableError(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  return code === "42P01" || code === "PGRST205" || message.includes("does not exist");
}

async function saveLinksToJsonColumn(
  supabase: SupabaseClient,
  restaurantId: string,
  links: RestaurantLinkInput[]
): Promise<void> {
  const payload = links.map((link, index) => ({
    id: `link-${index}`,
    label: link.label,
    url: link.url,
  }));

  const { error } = await supabase
    .from("restaurants")
    .update({
      custom_links: payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", restaurantId);

  if (error) {
    if (isMissingColumnError(error)) {
      throw new Error(
        'Links could not be saved because neither "restaurant_links" nor "custom_links" is available. Run supabase/migrations/20250628000000_nested_categories_and_links.sql in Supabase.'
      );
    }
    throw error;
  }
}

async function saveLinksToTable(
  supabase: SupabaseClient,
  restaurantId: string,
  links: RestaurantLinkInput[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("restaurant_links")
    .delete()
    .eq("restaurant_id", restaurantId);

  if (deleteError) {
    if (isMissingTableError(deleteError)) {
      await saveLinksToJsonColumn(supabase, restaurantId, links);
      return;
    }
    throw deleteError;
  }

  if (links.length === 0) {
    return;
  }

  const rows = links.map((link, index) => ({
    restaurant_id: restaurantId,
    label: link.label,
    url: link.url,
    order_index: index,
  }));

  const { error: insertError } = await supabase.from("restaurant_links").insert(rows);

  if (insertError) {
    if (isMissingTableError(insertError)) {
      await saveLinksToJsonColumn(supabase, restaurantId, links);
      return;
    }
    throw insertError;
  }
}

export async function fetchRestaurantLinks(restaurantId: string): Promise<RestaurantLink[]> {
  const supabase = createAnonClient();

  const { data, error } = await supabase
    .from("restaurant_links")
    .select("id, label, url, order_index")
    .eq("restaurant_id", restaurantId)
    .order("order_index", { ascending: true });

  if (!error && data && data.length > 0) {
    return data.map((row) => ({
      id: row.id,
      label: row.label,
      url: row.url,
      order_index: row.order_index ?? 0,
    }));
  }

  if (error && !isMissingTableError(error) && error.code !== "PGRST116") {
    logSupabaseFailure("fetchRestaurantLinks", error);
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("custom_links")
    .eq("id", restaurantId)
    .single();

  if (restaurantError || !restaurant?.custom_links) {
    return [];
  }

  const legacy = Array.isArray(restaurant.custom_links) ? restaurant.custom_links : [];
  return legacy
    .filter((link: { label?: string; url?: string }) => link.label && link.url)
    .map((link: { id?: string; label: string; url: string }, index: number) => ({
      id: link.id ?? `legacy-${index}`,
      label: link.label,
      url: link.url,
      order_index: index,
    }));
}

export async function saveRestaurantLinks(
  restaurantId: string,
  links: RestaurantLinkInput[]
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const validLinks = normalizeLinks(links);

  try {
    await saveLinksToTable(supabase, restaurantId, validLinks);
  } catch (tableError) {
    console.error("[saveRestaurantLinks:Failed]", tableError);
    try {
      await saveLinksToJsonColumn(supabase, restaurantId, validLinks);
    } catch (jsonError) {
      console.error("[saveRestaurantLinks:JsonFallbackFailed]", jsonError);
      throw new Error(formatSchemaError(jsonError));
    }
  }
}
