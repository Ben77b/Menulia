import { NextResponse } from "next/server";
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
  mergeLocalizedText,
  parseLocalizedFieldFromDb,
  serializeLocalizedFieldForDb,
  stripTranslationBrandProtection,
  wrapTextAsNonTranslatable,
  type LocalizedTextValue,
} from "@/lib/localized-text";
import {
  buildTranslationCacheKey,
  lookupTranslationCache,
  saveTranslationCacheEntries,
  translationCacheCompositeKey,
} from "@/lib/translation-cache";
import { DEEPL_CULINARY_CONTEXT } from "@/lib/deepl-culinary-context";

export const dynamic = "force-dynamic";

const DEEPL_BATCH_SIZE = 50;
const RATE_LIMIT_MS = 8_000;

const requestSchema = z.object({
  slug: z.string().min(1).max(120),
  target_lang: z.string().min(2).max(8),
});

type PendingItem = {
  entityType: "category" | "dish";
  entityId: string;
  field: "name" | "description";
  text: string;
  current: LocalizedTextValue;
  lockTitle?: boolean;
};

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
  // Omit source_lang → DeepL auto-detect (handles mixed/bilingual menus)

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

function pushField(
  items: PendingItem[],
  entityType: "category" | "dish",
  entityId: string,
  field: "name" | "description",
  value: LocalizedTextValue,
  targetLang: MenuContentLanguage,
  primaryLang: MenuContentLanguage,
  lockTitle?: boolean
) {
  const text = collectTextForTranslation(value, targetLang, primaryLang);
  if (!text) return;
  items.push({
    entityType,
    entityId,
    field,
    text,
    current: value,
    lockTitle,
  });
}

export async function POST(request: Request) {
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

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const slug = parsed.data.slug.trim().toLowerCase();
    const targetLangRaw = parsed.data.target_lang.trim().toLowerCase();
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
      });
    }
    recentRequests.set(rateKey, now);

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, name, primary_language")
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
          .select("id, category_id, name, description, lock_title_translation")
          .in("category_id", categoryIds)
      : { data: [], error: null };

    if (dishesError) {
      console.error("[public-menu-translate] dishes", dishesError);
      return NextResponse.json({ error: "Could not load dishes." }, { status: 500 });
    }

    const pending: PendingItem[] = [];

    for (const category of categories ?? []) {
      const name = parseLocalizedFieldFromDb(category.name);
      const description = parseLocalizedFieldFromDb(category.description);
      const lockTitle = Boolean(
        (category as { lock_title_translation?: boolean }).lock_title_translation
      );
      if (!lockTitle) {
        pushField(pending, "category", category.id as string, "name", name, targetLang, primaryLang);
      }
      pushField(
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
      pushField(
        pending,
        "dish",
        dish.id as string,
        "name",
        name,
        targetLang,
        primaryLang,
        Boolean(dish.lock_title_translation)
      );
      pushField(
        pending,
        "dish",
        dish.id as string,
        "description",
        description,
        targetLang,
        primaryLang
      );
    }

    if (pending.length === 0) {
      return NextResponse.json({
        target_lang: targetLang,
        already_complete: true,
        categories: [],
        dishes: [],
      });
    }

    const textsForDeepL = pending.map((item) =>
      item.lockTitle && item.field === "name"
        ? wrapTextAsNonTranslatable(item.text)
        : item.text
    );

    const cacheKeys = textsForDeepL.map((text) =>
      buildTranslationCacheKey(text, "auto-culinary", deeplTarget, "html")
    );
    const cacheHits = await lookupTranslationCache(cacheKeys);
    const translations: string[] = new Array(textsForDeepL.length).fill("");
    const missIndexes: number[] = [];

    textsForDeepL.forEach((_, index) => {
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
      const batchTexts = batchIndexes.map((index) => textsForDeepL[index]);
      const chunk = await translateBatch(apiKey, batchTexts, deeplTarget);
      chunk.forEach((text, batchOffset) => {
        const index = batchIndexes[batchOffset];
        translations[index] = text;
        cacheWrites.push({
          ...cacheKeys[index],
          translatedText: text,
        });
      });
    }

    await saveTranslationCacheEntries(cacheWrites);

    const categoryPatches = new Map<
      string,
      { id: string; name?: LocalizedTextValue; description?: LocalizedTextValue }
    >();
    const dishPatches = new Map<
      string,
      { id: string; name?: LocalizedTextValue; description?: LocalizedTextValue }
    >();

    pending.forEach((item, index) => {
      const translated = stripTranslationBrandProtection(translations[index]?.trim() ?? "");
      const merged = mergeLocalizedText(
        item.current,
        targetLang,
        translated || item.text,
        primaryLang
      );
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

    // Persist permanently via service role (guest cannot UPDATE under RLS)
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
    ]);

    return NextResponse.json({
      target_lang: targetLang,
      already_complete: false,
      categories: Array.from(categoryPatches.values()),
      dishes: Array.from(dishPatches.values()),
    });
  } catch (error) {
    console.error("[public-menu-translate]", error);
    return NextResponse.json(
      { error: "Could not translate menu. Try again shortly." },
      { status: 500 }
    );
  }
}
