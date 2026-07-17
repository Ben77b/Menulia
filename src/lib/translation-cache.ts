import { createHash } from "crypto";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";

export interface TranslationCacheKey {
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  tagHandling: string;
}

export interface TranslationCacheEntry {
  translatedText: string;
  detectedSourceLanguage: string | null;
}

function normalizeSourceLang(sourceLang: string | undefined): string {
  const normalized = sourceLang?.trim().toLowerCase();
  if (!normalized || normalized === "auto") return "auto";
  return normalized.toUpperCase();
}

function normalizeTargetLang(targetLang: string): string {
  return targetLang.trim().toUpperCase();
}

function normalizeTagHandling(tagHandling: string | undefined): string {
  return tagHandling?.trim().toLowerCase() ?? "";
}

export function hashTranslationSource(sourceText: string): string {
  return createHash("sha256").update(sourceText).digest("hex");
}

export function buildTranslationCacheKey(
  sourceText: string,
  sourceLang: string | undefined,
  targetLang: string,
  tagHandling?: "html" | "xml"
): TranslationCacheKey {
  return {
    sourceText,
    sourceLang: normalizeSourceLang(sourceLang),
    targetLang: normalizeTargetLang(targetLang),
    tagHandling: normalizeTagHandling(tagHandling),
  };
}

export async function lookupTranslationCache(
  keys: TranslationCacheKey[]
): Promise<Map<string, TranslationCacheEntry>> {
  const results = new Map<string, TranslationCacheEntry>();
  if (keys.length === 0) return results;

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return results;

  const hashes = [...new Set(keys.map((key) => hashTranslationSource(key.sourceText)))];

  const { data, error } = await supabase
    .from("translation_cache")
    .select(
      "source_hash, source_lang, target_lang, tag_handling, translated_text, detected_source_language"
    )
    .in("source_hash", hashes);

  if (error) {
    console.error("[translate-cache] lookup failed", error.message);
    return results;
  }

  const byComposite = new Map<string, TranslationCacheEntry>();
  for (const row of data ?? []) {
    const composite = [
      row.source_hash,
      row.source_lang,
      row.target_lang,
      row.tag_handling ?? "",
    ].join("|");
    byComposite.set(composite, {
      translatedText: row.translated_text,
      detectedSourceLanguage: row.detected_source_language ?? null,
    });
  }

  for (const key of keys) {
    const composite = [
      hashTranslationSource(key.sourceText),
      key.sourceLang,
      key.targetLang,
      key.tagHandling,
    ].join("|");
    const hit = byComposite.get(composite);
    if (hit) {
      results.set(composite, hit);
    }
  }

  return results;
}

export function translationCacheCompositeKey(key: TranslationCacheKey): string {
  return [
    hashTranslationSource(key.sourceText),
    key.sourceLang,
    key.targetLang,
    key.tagHandling,
  ].join("|");
}

export async function saveTranslationCacheEntries(
  entries: Array<
    TranslationCacheKey & {
      translatedText: string;
      detectedSourceLanguage?: string;
    }
  >
): Promise<void> {
  if (entries.length === 0) return;

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return;

  const rows = entries.map((entry) => ({
    source_hash: hashTranslationSource(entry.sourceText),
    source_text: entry.sourceText,
    source_lang: entry.sourceLang,
    target_lang: entry.targetLang,
    tag_handling: entry.tagHandling,
    translated_text: entry.translatedText,
    detected_source_language: entry.detectedSourceLanguage ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("translation_cache").upsert(rows, {
    onConflict: "source_hash,source_lang,target_lang,tag_handling",
  });

  if (error) {
    console.error("[translate-cache] upsert failed", error.message);
  }
}
