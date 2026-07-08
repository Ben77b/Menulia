import { parseDishTagsFromDb, serializeDishTagsForDb } from "./dietary-tags";
import {
  parseLocalizedFieldFromDb,
  resolveLocalizedText,
  serializeLocalizedFieldForDb,
  type LocalizedTextValue,
} from "./localized-text";
import { getSupabaseBrowserClient } from "./supabase";
import { logSupabaseFailure } from "./auth/errors";
import { isMissingColumnError } from "./restaurant-settings";

function readIsAvailable(dish: Record<string, unknown>): boolean {
  return dish.is_available !== false;
}

async function insertDishRow(
  payload: Record<string, unknown>
): Promise<{ data: Record<string, unknown> | null; error: unknown }> {
  const supabase = getSupabaseBrowserClient();
  let current: Record<string, unknown> = { ...payload, is_available: payload.is_available ?? true };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await supabase.from("dishes").insert(current).select("*").single();
    if (!result.error || !isMissingColumnError(result.error)) {
      return result;
    }

    if ("is_available" in current) {
      const { is_available: _ignored, ...withoutAvailability } = current;
      current = withoutAvailability;
      continue;
    }

    if ("hide_price" in current) {
      const { hide_price: _ignored, ...withoutHidePrice } = current;
      current = withoutHidePrice;
      continue;
    }

    if ("lock_title_translation" in current) {
      const { lock_title_translation: _ignored, ...withoutLockTitle } = current;
      current = withoutLockTitle;
      continue;
    }

    if ("display_order" in current) {
      const { display_order: _ignored, ...withoutOrder } = current;
      current = withoutOrder;
      continue;
    }

    return result;
  }

  return { data: null, error: new Error("Dish insert failed after column fallbacks.") };
}

async function updateDishRow(
  dishId: string,
  payload: Record<string, unknown>
): Promise<{ error: unknown; availabilityPersisted: boolean }> {
  const supabase = getSupabaseBrowserClient();

  let result = await supabase.from("dishes").update(payload).eq("id", dishId);
  if (result.error && isMissingColumnError(result.error)) {
    const hasHidePrice = "hide_price" in payload;
    const hasLockTitleTranslation = "lock_title_translation" in payload;
    const hasAvailability = "is_available" in payload;

    // Retry without `hide_price` first to preserve `is_available` updates.
    if (hasHidePrice) {
      const { hide_price: _ignored, ...withoutHidePrice } = payload;
      result = await supabase.from("dishes").update(withoutHidePrice).eq("id", dishId);

      if (!result.error) {
        return { error: result.error, availabilityPersisted: !result.error && hasAvailability };
      }

      // If we still get a missing-column error, drop `is_available` as well.
      if (hasAvailability && isMissingColumnError(result.error)) {
        const { is_available: _ignored2, ...withoutAvailability } = withoutHidePrice;
        result = await supabase
          .from("dishes")
          .update(withoutAvailability)
          .eq("id", dishId);
        return { error: result.error, availabilityPersisted: false };
      }

      return { error: result.error, availabilityPersisted: false };
    }

    if (hasLockTitleTranslation) {
      const { lock_title_translation: _ignored, ...withoutLockTitle } = payload;
      result = await supabase.from("dishes").update(withoutLockTitle).eq("id", dishId);

      if (!result.error) {
        return { error: result.error, availabilityPersisted: !result.error && hasAvailability };
      }

      if (hasAvailability && isMissingColumnError(result.error)) {
        const { is_available: _ignored2, ...withoutAvailability } = withoutLockTitle;
        result = await supabase
          .from("dishes")
          .update(withoutAvailability)
          .eq("id", dishId);
        return { error: result.error, availabilityPersisted: false };
      }

      return { error: result.error, availabilityPersisted: false };
    }

    if (hasAvailability && isMissingColumnError(result.error)) {
      const { is_available: _ignored, ...withoutAvailability } = payload;
      result = await supabase.from("dishes").update(withoutAvailability).eq("id", dishId);
      return { error: result.error, availabilityPersisted: false };
    }
  }

  return {
    error: result.error,
    availabilityPersisted: !result.error && "is_available" in payload,
  };
}

export interface MenuCategoryRecord {
  id: string;
  name: LocalizedTextValue;
  description: LocalizedTextValue | null;
  layout_type: string;
  order_index: number;
  parent_id: string | null;
  items: MenuDishRecord[];
}

export interface MenuDishRecord {
  id: string;
  name: LocalizedTextValue;
  description: LocalizedTextValue;
  price: number;
  image_url: string | null;
  tags: string[];
  allergens: string[];
  is_available: boolean;
  /** If true, omit the dish price from the public menu */
  hide_price: boolean;
  /** If true, skip translating the dish title during DeepL menu translation */
  lock_title_translation: boolean;
  display_order: number;
}

function mapDishRecord(dish: Record<string, unknown>): MenuDishRecord {
  const normalized = parseDishTagsFromDb(dish);
  return {
    id: dish.id as string,
    name: parseLocalizedFieldFromDb(dish.name),
    description: parseLocalizedFieldFromDb(dish.description),
    price: parseFloat(String(dish.price)) || 0,
    image_url: (dish.image as string) ?? null,
    tags: normalized.tags,
    allergens: normalized.allergens,
    is_available: readIsAvailable(dish),
    hide_price: Boolean(dish.hide_price),
    lock_title_translation: Boolean(dish.lock_title_translation),
    display_order: Number(dish.display_order ?? 0),
  };
}

async function fetchDishesForCategory(categoryId: string): Promise<MenuDishRecord[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: withOrder, error: orderError } = await supabase
    .from("dishes")
    .select("*")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!orderError) {
    return (withOrder ?? []).map((dish) => mapDishRecord(dish as Record<string, unknown>));
  }

  if (!isMissingColumnError(orderError)) {
    logSupabaseFailure("menu.fetchDishes", orderError);
    throw orderError;
  }

  const { data: withoutOrder, error: fallbackError } = await supabase
    .from("dishes")
    .select("*")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: true });

  if (fallbackError) {
    logSupabaseFailure("menu.fetchDishes", fallbackError);
    throw fallbackError;
  }

  return (withoutOrder ?? []).map((dish, index) => ({
    ...mapDishRecord(dish as Record<string, unknown>),
    display_order: index,
  }));
}

async function getNextCategoryOrderIndex(
  restaurantId: string,
  parentId: string | null
): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  let query = supabase
    .from("categories")
    .select("order_index")
    .eq("restaurant_id", restaurantId)
    .order("order_index", { ascending: false })
    .limit(1);

  query = parentId === null ? query.is("parent_id", null) : query.eq("parent_id", parentId);

  const { data, error } = await query;
  if (error || !data?.length) return 0;
  return (data[0].order_index ?? 0) + 1;
}

async function getNextDishDisplayOrder(categoryId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("dishes")
    .select("display_order")
    .eq("category_id", categoryId);

  if (error && isMissingColumnError(error)) {
    const { count } = await supabase
      .from("dishes")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);
    return count ?? 0;
  }

  if (error || !data?.length) return 0;
  return Math.max(...data.map((row) => Number(row.display_order ?? 0)), 0) + 1;
}

export async function fetchMenuCategories(restaurantId: string): Promise<MenuCategoryRecord[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("order_index", { ascending: true });

  if (categoriesError) {
    logSupabaseFailure("menu.fetchCategories", categoriesError);
    throw categoriesError;
  }

  const rows = categories ?? [];

  return Promise.all(
    rows.map(async (category) => {
      const items = await fetchDishesForCategory(category.id);

      return {
        id: category.id,
        name: parseLocalizedFieldFromDb(category.name),
        description: parseLocalizedFieldFromDb(category.description) || null,
        layout_type: category.layout_type ?? "stacked",
        order_index: category.order_index ?? 0,
        parent_id: category.parent_id ?? null,
        items,
      };
    })
  );
}

export async function createMenuCategory(
  name: string,
  restaurantId: string,
  options?: {
    layout_type?: "stacked" | "carousel";
    parent_id?: string | null;
    description?: string | null;
  }
): Promise<MenuCategoryRecord> {
  const supabase = getSupabaseBrowserClient();
  const parentId = options?.parent_id ?? null;
  const orderIndex = await getNextCategoryOrderIndex(restaurantId, parentId);

  const payload: Record<string, unknown> = {
    name: name.trim(),
    restaurant_id: restaurantId,
    layout_type: options?.layout_type ?? "stacked",
    parent_id: parentId,
    order_index: orderIndex,
  };

  if (options?.description?.trim()) {
    payload.description = options.description.trim();
  }

  let { data, error } = await supabase.from("categories").insert(payload).select("*").single();

  if (error && isMissingColumnError(error) && "description" in payload) {
    const { description: _ignored, ...withoutDescription } = payload;
    ({ data, error } = await supabase.from("categories").insert(withoutDescription).select("*").single());
  }

  if (error || !data) {
    logSupabaseFailure("menu.createCategory", error);
    throw error ?? new Error("Category insert failed.");
  }

  return {
    id: data.id,
    name: parseLocalizedFieldFromDb(data.name),
    description: parseLocalizedFieldFromDb(data.description) || null,
    layout_type: data.layout_type ?? "stacked",
    order_index: data.order_index ?? 0,
    parent_id: data.parent_id ?? null,
    items: [],
  };
}

export async function updateMenuCategory(
  categoryId: string,
  updates: Partial<
    Pick<MenuCategoryRecord, "name" | "description" | "layout_type" | "order_index" | "parent_id">
  >
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const payload: Record<string, unknown> = { ...updates };

  if ("name" in payload && payload.name !== undefined) {
    payload.name = serializeLocalizedFieldForDb(payload.name as LocalizedTextValue);
  }
  if ("description" in payload) {
    payload.description =
      payload.description === null || payload.description === undefined
        ? null
        : serializeLocalizedFieldForDb(payload.description as LocalizedTextValue);
  }

  let { error } = await supabase.from("categories").update(payload).eq("id", categoryId);

  if (error && isMissingColumnError(error) && "description" in updates) {
    const { description: _ignored, ...withoutDescription } = updates;
    ({ error } = await supabase.from("categories").update(withoutDescription).eq("id", categoryId));
  }

  if (error) {
    logSupabaseFailure("menu.updateCategory", error);
    throw error;
  }
}

export async function deleteMenuCategory(categoryId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);

  if (error) {
    logSupabaseFailure("menu.deleteCategory", error);
    throw error;
  }
}

export async function createMenuDish(
  categoryId: string,
  name: string,
  description: string,
  price: number,
  image: string | null = null,
  tags: string[] = [],
  allergens: string[] = [],
  hidePrice: boolean = false,
  options?: { displayOrder?: number }
): Promise<MenuDishRecord> {
  const tagsForDb = serializeDishTagsForDb(tags, allergens);
  const displayOrder =
    options?.displayOrder ?? (await getNextDishDisplayOrder(categoryId));

  const { data, error } = await insertDishRow({
    category_id: categoryId,
    name: name.trim(),
    description: description.trim(),
    price: String(price),
    image,
    tags: tagsForDb,
    is_available: true,
    hide_price: hidePrice,
    display_order: displayOrder,
  });

  if (error || !data) {
    logSupabaseFailure("menu.createDish", error);
    throw error ?? new Error("Dish insert failed.");
  }

  return mapDishRecord(data);
}

export async function updateMenuDish(
  dishId: string,
  name: LocalizedTextValue,
  description: LocalizedTextValue,
  price: number,
  image: string | null = null,
  tags: string[] = [],
  allergens: string[] = [],
  isAvailable = true,
  hidePrice: boolean = false,
  lockTitleTranslation: boolean = false
): Promise<void> {
  const tagsForDb = serializeDishTagsForDb(tags, allergens);

  const { error } = await updateDishRow(dishId, {
    name: serializeLocalizedFieldForDb(name),
    description: serializeLocalizedFieldForDb(description),
    price: String(price),
    image,
    tags: tagsForDb,
    is_available: isAvailable,
    hide_price: hidePrice,
    lock_title_translation: lockTitleTranslation,
  });

  if (error) {
    logSupabaseFailure("menu.updateDish", error);
    throw error;
  }
}

export class DishAvailabilityUnsupportedError extends Error {
  constructor() {
    super(
      "Dish visibility requires the is_available column on dishes. Run supabase/migrations/20250705000000_dish_is_available_column.sql in the Supabase SQL editor."
    );
    this.name = "DishAvailabilityUnsupportedError";
  }
}

export async function updateMenuDishAvailability(
  dishId: string,
  isAvailable: boolean
): Promise<void> {
  const { error, availabilityPersisted } = await updateDishRow(dishId, {
    is_available: isAvailable,
  });

  if (error) {
    logSupabaseFailure("menu.updateDishAvailability", error);
    if (isMissingColumnError(error)) {
      throw new DishAvailabilityUnsupportedError();
    }
    throw error;
  }

  if (!availabilityPersisted) {
    throw new DishAvailabilityUnsupportedError();
  }
}

export async function deleteMenuDish(dishId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("dishes").delete().eq("id", dishId);

  if (error) {
    logSupabaseFailure("menu.deleteDish", error);
    throw error;
  }
}

function duplicateName(name: LocalizedTextValue): LocalizedTextValue {
  const base = resolveLocalizedText(name, "en").trim();
  const copy = base.endsWith("(Copy)") ? `${base} (Copy)` : `${base} (Copy)`;
  if (typeof name === "string" || !base) return copy;
  if (typeof name === "object" && name !== null && !Array.isArray(name)) {
    return { ...name, en: copy };
  }
  return copy;
}

async function cloneDishToCategory(
  source: Record<string, unknown>,
  categoryId: string
): Promise<MenuDishRecord> {
  const normalized = parseDishTagsFromDb(source);
  const tagsForDb = serializeDishTagsForDb(normalized.tags, normalized.allergens);

  const { data, error: insertError } = await insertDishRow({
    category_id: categoryId,
    name: serializeLocalizedFieldForDb(source.name as LocalizedTextValue),
    description: serializeLocalizedFieldForDb(source.description as LocalizedTextValue),
    price: String(source.price ?? "0"),
    image: (source.image as string | null) ?? null,
    tags: tagsForDb,
    is_available: readIsAvailable(source),
    hide_price: Boolean(source.hide_price),
    lock_title_translation: Boolean(source.lock_title_translation),
    display_order: Number(source.display_order ?? 0),
  });

  if (insertError || !data) {
    logSupabaseFailure("menu.cloneDishToCategory.insert", insertError);
    throw insertError ?? new Error("Dish clone failed.");
  }

  return mapDishRecord(data);
}

export async function duplicateMenuDish(dishId: string): Promise<MenuDishRecord> {
  const supabase = getSupabaseBrowserClient();
  const { data: source, error } = await supabase.from("dishes").select("*").eq("id", dishId).single();

  if (error || !source) {
    logSupabaseFailure("menu.duplicateDish.fetch", error);
    throw error ?? new Error("Dish not found.");
  }

  const normalized = parseDishTagsFromDb(source);
  const tagsForDb = serializeDishTagsForDb(normalized.tags, normalized.allergens);

  const displayOrder = await getNextDishDisplayOrder(source.category_id as string);

  const { data, error: insertError } = await insertDishRow({
    category_id: source.category_id,
    name: serializeLocalizedFieldForDb(duplicateName(source.name as LocalizedTextValue)),
    description: serializeLocalizedFieldForDb(source.description as LocalizedTextValue),
    price: String(source.price ?? "0"),
    image: (source.image as string | null) ?? null,
    tags: tagsForDb,
    is_available: readIsAvailable(source as Record<string, unknown>),
    hide_price: Boolean((source as Record<string, unknown>).hide_price),
    lock_title_translation: Boolean(
      (source as Record<string, unknown>).lock_title_translation
    ),
    display_order: displayOrder,
  });

  if (insertError || !data) {
    logSupabaseFailure("menu.duplicateDish.insert", insertError);
    throw insertError ?? new Error("Dish duplicate failed.");
  }

  return mapDishRecord(data);
}

export async function duplicateMenuCategory(
  categoryId: string,
  restaurantId: string
): Promise<MenuCategoryRecord> {
  const supabase = getSupabaseBrowserClient();
  const { data: source, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (error || !source) {
    logSupabaseFailure("menu.duplicateCategory.fetch", error);
    throw error ?? new Error("Category not found.");
  }

  const created = await createMenuCategory(
    resolveLocalizedText(duplicateName(source.name as LocalizedTextValue), "en"),
    restaurantId,
    {
      layout_type: source.layout_type === "carousel" ? "carousel" : "stacked",
      parent_id: (source.parent_id as string | null) ?? null,
      description: resolveLocalizedText(source.description as LocalizedTextValue, "en") || null,
    }
  );

  try {
    const sourceDishes = await fetchDishesForCategory(categoryId);

    const clonedDishes: MenuDishRecord[] = [];
    for (const dish of sourceDishes) {
      clonedDishes.push(
        await cloneDishToCategory(
          {
            name: dish.name,
            description: dish.description,
            price: dish.price,
            image: dish.image_url,
            tags: serializeDishTagsForDb(dish.tags, dish.allergens),
            is_available: dish.is_available,
            hide_price: dish.hide_price,
            lock_title_translation: dish.lock_title_translation,
            display_order: dish.display_order,
          },
          created.id
        )
      );
    }

    return { ...created, items: clonedDishes };
  } catch (cloneError) {
    try {
      await deleteMenuCategory(created.id);
    } catch (rollbackError) {
      logSupabaseFailure("menu.duplicateCategory.rollback", rollbackError);
    }
    throw cloneError;
  }
}

export async function reorderMenuCategories(
  updates: Array<{ id: string; order_index: number }>
): Promise<void> {
  await Promise.all(
    updates.map(({ id, order_index }) => updateMenuCategory(id, { order_index }))
  );
}

export async function reorderMenuDishes(
  updates: Array<{ id: string; display_order: number }>
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  await Promise.all(
    updates.map(async ({ id, display_order }) => {
      let { error } = await supabase.from("dishes").update({ display_order }).eq("id", id);
      if (error && isMissingColumnError(error)) {
        return;
      }
      if (error) {
        logSupabaseFailure("menu.reorderDishes", error);
        throw error;
      }
    })
  );
}
