import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runtimeEnv } from "@/lib/runtime-env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import {
  getMenuContentLanguageMeta,
  isGuestAutoTranslateLanguage,
  normalizePrimaryLanguage,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";
import {
  collectTextForTranslation,
  keepPrimaryLocalizedText,
  localizedTextHasNonPrimaryKeys,
  mergeLocalizedText,
  parseLocalizedFieldFromDb,
  serializeLocalizedFieldForDb,
  stripTranslationBrandProtection,
  type LocalizedTextValue,
} from "@/lib/localized-text";
import {
  buildTranslationCacheKey,
  lookupTranslationCache,
  saveTranslationCacheEntries,
  translationCacheCompositeKey,
} from "@/lib/translation-cache";
import { DEEPL_CULINARY_CONTEXT } from "@/lib/deepl-culinary-context";
import { isFilterableTag, parseDishTag } from "@/lib/dietary-tags";
import {
  isIsolatedMenuTerm,
  lookupGlossaryTranslation,
  unwrapIsolatedMenuTerm,
  wrapIsolatedMenuTerm,
} from "@/lib/translation-glossary";

const DEEPL_BATCH_SIZE = 50;
const TRANSLATION_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=60";

function translationJsonResponse(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: { "Cache-Control": TRANSLATION_CACHE_CONTROL },
  });
}
const RATE_LIMIT_MS = 8_000;

const requestSchema = z.object({
  slug: z.string().min(1).max(120),
  lang: z.string().min(2).max(8),
});

type MenuPendingItem = {
  kind: "menu";
  entityType: "category" | "dish";
  entityId: string;
  field: "name" | "description";
  text: string;
  current: LocalizedTextValue;
};

type RestaurantPendingItem = {
  kind: "restaurant";
  field: "footer_slogan" | "meta_description" | "hours";
  text: string;
  current: LocalizedTextValue;
};

type TagPendingItem = {
  kind: "tag";
  sourceLabel: string;
  text: string;
};

type PendingItem = MenuPendingItem | RestaurantPendingItem | TagPendingItem;

const recentRequests = new Map<string, number>();

function getClientKey(request: Request, slug: string, targetLang: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${slug}:${targetLang}`;
}

function getDeepLEndpoint(apiKey: string): string {
  return apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
}

async function translateBatch(
  apiKey: string,
  texts: string[],
  targetLang: string
): Promise<string[]> {
  const endpoint = getDeepLEndpoint(apiKey);
  const body = new URLSearchParams();
  texts.forEach((text) => body.append("text", text));
  body.set("target_lang", targetLang.toUpperCase());
  body.set("preserve_formatting", "1");
  body.set("tag_handling", "html");
  body.set("context", DEEPL_CULINARY_CONTEXT);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("[public-menu-translate] DeepL error", response.status, details);
    throw new Error("DeepL translation failed");
  }

  const payload = (await response.json()) as {
    translations?: Array<{ text?: string }>;
  };
  const translations = payload.translations ?? [];
  if (translations.length !== texts.length) {
    throw new Error("DeepL returned an unexpected number of translations");
  }
  return translations.map((entry, index) => entry.text ?? texts[index] ?? "");
}

function pushMenuField(
  items: PendingItem[],
  entityType: "category" | "dish",
  entityId: string,
  field: "name" | "description",
  value: LocalizedTextValue,
  targetLang: MenuContentLanguage,
  primaryLang: MenuContentLanguage
) {
  const text = collectTextForTranslation(value, targetLang, primaryLang);
  if (!text) return;
  items.push({
    kind: "menu",
    entityType,
    entityId,
    field,
    text,
    current: value,
  });
}

function pushRestaurantField(
  items: PendingItem[],
  field: RestaurantPendingItem["field"],
  value: LocalizedTextValue,
  targetLang: MenuContentLanguage,
  primaryLang: MenuContentLanguage
) {
  const text = collectTextForTranslation(value, targetLang, primaryLang);
  if (!text) return;
  items.push({
    kind: "restaurant",
    field,
    text,
    current: value,
  });
}

function shouldWrapIsolatedTerm(item: PendingItem): boolean {
  if (item.kind === "restaurant" && item.field === "hours") return false;
  if (item.kind === "menu" && item.field === "description") return false;
  if (item.kind === "restaurant" && item.field === "footer_slogan") return false;
  if (item.kind === "restaurant" && item.field === "meta_description") {
    return isIsolatedMenuTerm(item.text);
  }
  return isIsolatedMenuTerm(item.text);
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = runtimeEnv("DEEPL_API_KEY");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Translation is not configured." },
        { status: 503 }
      );
    }

    const supabase = createServiceRoleSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Translation persistence is not configured." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = requestSchema.safeParse({
      slug: searchParams.get("slug") ?? "",
      lang: searchParams.get("lang") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const slug = parsed.data.slug.trim().toLowerCase();
    const targetLangRaw = parsed.data.lang.trim().toLowerCase();
    if (!isGuestAutoTranslateLanguage(targetLangRaw)) {
      return NextResponse.json({ error: "Unsupported target language." }, { status: 400 });
    }
    const targetLang = targetLangRaw;
    const deeplTarget = getMenuContentLanguageMeta(targetLang).deeplCode;

    const rateKey = getClientKey(request, slug, targetLang);
    const now = Date.now();
    const last = recentRequests.get(rateKey) ?? 0;
    if (now - last < RATE_LIMIT_MS) {
      return NextResponse.json({
        target_lang: targetLang,
        already_complete: false,
        rate_limited: true,
        categories: [],
        dishes: [],
        restaurant: null,
        tag_labels: {},
      });
    }
    recentRequests.set(rateKey, now);

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, name, primary_language, footer_slogan, meta_description, hours")
      .eq("slug", slug)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const restaurantId = restaurant.id as string;
    const primaryLang = normalizePrimaryLanguage(restaurant.primary_language);

    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, description, lock_title_translation")
      .eq("restaurant_id", restaurantId);

    if (categoriesError) {
      console.error("[public-menu-translate] categories", categoriesError);
      return NextResponse.json({ error: "Could not load menu." }, { status: 500 });
    }

    const categoryIds = (categories ?? []).map((row) => row.id as string);
    const { data: dishes, error: dishesError } = categoryIds.length
      ? await supabase
          .from("dishes")
          .select("id, category_id, name, description, lock_title_translation, tags")
          .in("category_id", categoryIds)
      : { data: [], error: null };

    if (dishesError) {
      console.error("[public-menu-translate] dishes", dishesError);
      return NextResponse.json({ error: "Could not load dishes." }, { status: 500 });
    }

    // ── Absolute lock scrub: wipe stale translated titles before any DeepL work ──
    const categoryPatches = new Map<
      string,
      { id: string; name?: LocalizedTextValue; description?: LocalizedTextValue }
    >();
    const dishPatches = new Map<
      string,
      { id: string; name?: LocalizedTextValue; description?: LocalizedTextValue }
    >();
    const lockScrubWrites: Array<Promise<void>> = [];

    for (const category of categories ?? []) {
      const lockTitle = Boolean(
        (category as { lock_title_translation?: boolean }).lock_title_translation
      );
      if (!lockTitle) continue;
      const name = parseLocalizedFieldFromDb(category.name);
      if (!localizedTextHasNonPrimaryKeys(name, primaryLang)) continue;
      const scrubbed = keepPrimaryLocalizedText(name, primaryLang);
      const patch = categoryPatches.get(category.id as string) ?? {
        id: category.id as string,
      };
      patch.name = scrubbed;
      categoryPatches.set(category.id as string, patch);
      (category as { name: unknown }).name = serializeLocalizedFieldForDb(scrubbed);
      lockScrubWrites.push(
        (async () => {
          const { error } = await supabase
            .from("categories")
            .update({ name: serializeLocalizedFieldForDb(scrubbed) })
            .eq("id", category.id as string);
          if (error) {
            console.error("[public-menu-translate] category lock scrub", category.id, error);
          }
        })()
      );
    }

    for (const dish of dishes ?? []) {
      const lockTitle = Boolean(dish.lock_title_translation);
      if (!lockTitle) continue;
      const name = parseLocalizedFieldFromDb(dish.name);
      if (!localizedTextHasNonPrimaryKeys(name, primaryLang)) continue;
      const scrubbed = keepPrimaryLocalizedText(name, primaryLang);
      const patch = dishPatches.get(dish.id as string) ?? { id: dish.id as string };
      patch.name = scrubbed;
      dishPatches.set(dish.id as string, patch);
      (dish as { name: unknown }).name = serializeLocalizedFieldForDb(scrubbed);
      lockScrubWrites.push(
        (async () => {
          const { error } = await supabase
            .from("dishes")
            .update({ name: serializeLocalizedFieldForDb(scrubbed) })
            .eq("id", dish.id as string);
          if (error) {
            console.error("[public-menu-translate] dish lock scrub", dish.id, error);
          }
        })()
      );
    }

    await Promise.all(lockScrubWrites);

    const pending: PendingItem[] = [];

    for (const category of categories ?? []) {
      const name = parseLocalizedFieldFromDb(category.name);
      const description = parseLocalizedFieldFromDb(category.description);
      const lockTitle = Boolean(
        (category as { lock_title_translation?: boolean }).lock_title_translation
      );
      if (!lockTitle) {
        pushMenuField(
          pending,
          "category",
          category.id as string,
          "name",
          name,
          targetLang,
          primaryLang
        );
      }
      pushMenuField(
        pending,
        "category",
        category.id as string,
        "description",
        description,
        targetLang,
        primaryLang
      );
    }

    for (const dish of dishes ?? []) {
      const name = parseLocalizedFieldFromDb(dish.name);
      const description = parseLocalizedFieldFromDb(dish.description);
      const lockTitle = Boolean(dish.lock_title_translation);
      if (!lockTitle) {
        pushMenuField(pending, "dish", dish.id as string, "name", name, targetLang, primaryLang);
      }
      pushMenuField(
        pending,
        "dish",
        dish.id as string,
        "description",
        description,
        targetLang,
        primaryLang
      );
    }

    const footerSlogan = parseLocalizedFieldFromDb(restaurant.footer_slogan);
    const metaDescription = parseLocalizedFieldFromDb(restaurant.meta_description);
    const hours = parseLocalizedFieldFromDb(restaurant.hours);

    pushRestaurantField(pending, "footer_slogan", footerSlogan, targetLang, primaryLang);
    pushRestaurantField(pending, "meta_description", metaDescription, targetLang, primaryLang);
    pushRestaurantField(pending, "hours", hours, targetLang, primaryLang);

    const customTagLabels = new Set<string>();
    for (const dish of dishes ?? []) {
      const tags = Array.isArray(dish.tags) ? (dish.tags as string[]) : [];
      for (const raw of tags) {
        const label = parseDishTag(raw).label;
        if (!label || isFilterableTag(label)) continue;
        customTagLabels.add(label);
      }
    }

    for (const label of customTagLabels) {
      pending.push({ kind: "tag", sourceLabel: label, text: label });
    }

    if (pending.length === 0) {
      return translationJsonResponse({
        target_lang: targetLang,
        already_complete: categoryPatches.size === 0 && dishPatches.size === 0,
        categories: Array.from(categoryPatches.values()),
        dishes: Array.from(dishPatches.values()),
        restaurant: null,
        tag_labels: {},
      });
    }

    const textsForDeepL = pending.map((item) => item.text);
    const cacheKeys = textsForDeepL.map((text) =>
      buildTranslationCacheKey(text, "auto-culinary", deeplTarget, "html")
    );
    const cacheHits = await lookupTranslationCache(cacheKeys);
    const translations: string[] = new Array(textsForDeepL.length).fill("");
    const missIndexes: number[] = [];
    const wrappedIndexes = new Set<number>();

    textsForDeepL.forEach((text, index) => {
      const glossaryHit = lookupGlossaryTranslation(text, targetLang);
      if (glossaryHit) {
        translations[index] = glossaryHit;
        return;
      }

      const hit = cacheHits.get(translationCacheCompositeKey(cacheKeys[index]));
      if (hit) {
        translations[index] = hit.translatedText;
        return;
      }
      missIndexes.push(index);
    });

    const cacheWrites: Array<
      ReturnType<typeof buildTranslationCacheKey> & {
        translatedText: string;
        detectedSourceLanguage?: string;
      }
    > = [];

    for (let offset = 0; offset < missIndexes.length; offset += DEEPL_BATCH_SIZE) {
      const batchIndexes = missIndexes.slice(offset, offset + DEEPL_BATCH_SIZE);
      const batchTexts = batchIndexes.map((index) => {
        const item = pending[index];
        if (shouldWrapIsolatedTerm(item)) {
          wrappedIndexes.add(index);
          return wrapIsolatedMenuTerm(item.text);
        }
        return item.text;
      });
      const chunk = await translateBatch(apiKey, batchTexts, deeplTarget);
      chunk.forEach((text, batchOffset) => {
        const index = batchIndexes[batchOffset];
        const original = pending[index].text;
        const unwrapped = wrappedIndexes.has(index)
          ? unwrapIsolatedMenuTerm(text, original)
          : text;
        translations[index] = unwrapped;
        cacheWrites.push({
          ...cacheKeys[index],
          translatedText: unwrapped,
        });
      });
    }

    await saveTranslationCacheEntries(cacheWrites);

    let restaurantPatch: {
      footer_slogan?: LocalizedTextValue;
      meta_description?: LocalizedTextValue;
      hours?: LocalizedTextValue;
    } | null = null;
    const tagLabels: Record<string, string> = {};

    pending.forEach((item, index) => {
      const translated = stripTranslationBrandProtection(translations[index]?.trim() ?? "");

      if (item.kind === "tag") {
        tagLabels[item.sourceLabel] = translated || item.text;
        return;
      }

      const merged = mergeLocalizedText(
        item.current,
        targetLang,
        translated || item.text,
        primaryLang
      );

      if (item.kind === "restaurant") {
        restaurantPatch = restaurantPatch ?? {};
        restaurantPatch[item.field] = merged;
        return;
      }

      if (item.entityType === "category") {
        const patch = categoryPatches.get(item.entityId) ?? { id: item.entityId };
        patch[item.field] = merged;
        categoryPatches.set(item.entityId, patch);
      } else {
        const patch = dishPatches.get(item.entityId) ?? { id: item.entityId };
        patch[item.field] = merged;
        dishPatches.set(item.entityId, patch);
      }
    });

    await Promise.all([
      ...Array.from(categoryPatches.values()).map(async (patch) => {
        const payload: Record<string, string> = {};
        if (patch.name !== undefined) {
          payload.name = serializeLocalizedFieldForDb(patch.name);
        }
        if (patch.description !== undefined) {
          payload.description = serializeLocalizedFieldForDb(patch.description);
        }
        if (Object.keys(payload).length === 0) return;
        const { error } = await supabase.from("categories").update(payload).eq("id", patch.id);
        if (error) console.error("[public-menu-translate] category update", patch.id, error);
      }),
      ...Array.from(dishPatches.values()).map(async (patch) => {
        const payload: Record<string, string> = {};
        if (patch.name !== undefined) {
          payload.name = serializeLocalizedFieldForDb(patch.name);
        }
        if (patch.description !== undefined) {
          payload.description = serializeLocalizedFieldForDb(patch.description);
        }
        if (Object.keys(payload).length === 0) return;
        const { error } = await supabase.from("dishes").update(payload).eq("id", patch.id);
        if (error) console.error("[public-menu-translate] dish update", patch.id, error);
      }),
      (async () => {
        if (!restaurantPatch) return;
        const payload: Record<string, string> = {};
        if (restaurantPatch.footer_slogan !== undefined) {
          payload.footer_slogan = serializeLocalizedFieldForDb(restaurantPatch.footer_slogan);
        }
        if (restaurantPatch.meta_description !== undefined) {
          payload.meta_description = serializeLocalizedFieldForDb(
            restaurantPatch.meta_description
          );
        }
        if (restaurantPatch.hours !== undefined) {
          payload.hours = serializeLocalizedFieldForDb(restaurantPatch.hours);
        }
        if (Object.keys(payload).length === 0) return;
        const { error } = await supabase
          .from("restaurants")
          .update(payload)
          .eq("id", restaurantId);
        if (error) console.error("[public-menu-translate] restaurant update", error);
      })(),
    ]);

    const restaurantResponse = restaurantPatch
      ? {
          footer_slogan: restaurantPatch.footer_slogan ?? undefined,
          meta_description: restaurantPatch.meta_description ?? undefined,
          hours: restaurantPatch.hours ?? undefined,
        }
      : null;

    return translationJsonResponse({
      target_lang: targetLang,
      already_complete: false,
      categories: Array.from(categoryPatches.values()),
      dishes: Array.from(dishPatches.values()),
      restaurant: restaurantResponse,
      tag_labels: tagLabels,
    });
  } catch (error) {
    console.error("[public-menu-translate]", error);
    return NextResponse.json(
      { error: "Could not translate menu. Try again shortly." },
      { status: 500 }
    );
  }
}
