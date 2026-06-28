import { createAnonClient, getSupabaseBrowserClient } from "./supabase";
import { logSupabaseFailure } from "./auth/errors";

export interface RestaurantLink {
  id: string;
  label: string;
  url: string;
  order_index: number;
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

  if (error && error.code !== "PGRST116" && error.code !== "42P01") {
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
  links: Array<{ id?: string; label: string; url: string }>
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error: deleteError } = await supabase
    .from("restaurant_links")
    .delete()
    .eq("restaurant_id", restaurantId);

  if (deleteError && deleteError.code !== "42P01") {
    logSupabaseFailure("saveRestaurantLinks.delete", deleteError);
    throw deleteError;
  }

  if (links.length === 0) {
    await supabase
      .from("restaurants")
      .update({ custom_links: [], updated_at: new Date().toISOString() })
      .eq("id", restaurantId);
    return;
  }

  const rows = links.map((link, index) => ({
    restaurant_id: restaurantId,
    label: link.label.trim(),
    url: link.url.trim(),
    order_index: index,
  }));

  const { error: insertError } = await supabase.from("restaurant_links").insert(rows);

  if (insertError) {
    if (insertError.code === "42P01") {
      await supabase
        .from("restaurants")
        .update({
          custom_links: links.map((link, index) => ({
            id: link.id ?? String(Date.now() + index),
            label: link.label,
            url: link.url,
          })),
          updated_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);
      return;
    }

    logSupabaseFailure("saveRestaurantLinks.insert", insertError);
    throw insertError;
  }

  await supabase
    .from("restaurants")
    .update({
      custom_links: links.map((link, index) => ({
        id: link.id ?? String(Date.now() + index),
        label: link.label,
        url: link.url,
      })),
      updated_at: new Date().toISOString(),
    })
    .eq("id", restaurantId);
}
