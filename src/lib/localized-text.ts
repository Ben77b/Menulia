import type { MenuContentLanguage } from "./menu-content-languages";

export type LocalizedTextRecord = Record<string, string>;
export type LocalizedTextValue = string | LocalizedTextRecord | null | undefined;

function isLocalizedTextRecord(value: unknown): value is LocalizedTextRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(
    (entry) => typeof entry === "string"
  );
}

function normalizeText(input: unknown): string {
  return typeof input === "string" ? input : "";
}

export function resolveLocalizedText(
  value: LocalizedTextValue,
  lang: string = "en",
  fallbackLang: string = "en"
): string {
  if (typeof value === "string") return value;
  if (!isLocalizedTextRecord(value)) return "";

  return (
    normalizeText(value[lang]) ||
    normalizeText(value[fallbackLang]) ||
    normalizeText(Object.values(value)[0]) ||
    ""
  );
}

export function mergeLocalizedText(
  current: LocalizedTextValue,
  nextLang: string,
  nextText: string,
  baseLang: string = "en"
): LocalizedTextRecord {
  const existing: LocalizedTextRecord = isLocalizedTextRecord(current)
    ? { ...current }
    : typeof current === "string"
      ? { [baseLang]: current }
      : { [baseLang]: "" };

  if (nextLang === baseLang) {
    return { ...existing, [baseLang]: nextText };
  }

  const preservedBase =
    normalizeText(existing[baseLang]) || (typeof current === "string" ? current : "");

  return {
    ...existing,
    [baseLang]: preservedBase,
    [nextLang]: nextText,
  };
}

/** @deprecated Use restaurant primary_language — kept for legacy imports */
export const BUILDER_SOURCE_LANGUAGE = "en";

export function resolveBuilderSourceText(
  value: LocalizedTextValue,
  sourceLang: string = "en"
): string {
  if (typeof value === "string") return value;
  if (!isLocalizedTextRecord(value)) return "";
  return (
    normalizeText(value[sourceLang]) ||
    normalizeText(Object.values(value).find((text) => text.trim()) ?? "") ||
    ""
  );
}

export function resolveBuilderTranslationText(
  value: LocalizedTextValue,
  lang: string
): string {
  if (typeof value === "string") return "";
  if (!isLocalizedTextRecord(value)) return "";
  return normalizeText(value[lang]);
}

export function parseLocalizedFieldFromDb(value: unknown): LocalizedTextValue {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (isLocalizedTextRecord(parsed)) return parsed;
      } catch {
        return value;
      }
    }
    return value;
  }

  if (isLocalizedTextRecord(value)) return value;
  return "";
}

export function serializeLocalizedFieldForDb(value: LocalizedTextValue): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function countPopulatedLocaleKeys(value: LocalizedTextValue): number {
  if (typeof value === "string") return value.trim() ? 1 : 0;
  if (!isLocalizedTextRecord(value)) return 0;
  return Object.values(value).filter((text) => text.trim()).length;
}

/** True when a field stores guest-facing copy in more than one language. */
export function fieldHasGuestTranslations(value: LocalizedTextValue): boolean {
  return countPopulatedLocaleKeys(value) >= 2;
}

/** Pick the best source text to send for translation into `targetLang`. */
export function collectTextForTranslation(
  value: LocalizedTextValue,
  targetLang: string,
  primaryLang: string = "en"
): string {
  if (typeof value === "string") return value.trim();
  if (!isLocalizedTextRecord(value)) return "";

  if (normalizeText(value[targetLang]).trim()) {
    return "";
  }

  const counterpart = targetLang === primaryLang ? (primaryLang === "en" ? "es" : "en") : primaryLang;
  if (normalizeText(value[counterpart]).trim()) {
    return value[counterpart].trim();
  }

  for (const [lang, text] of Object.entries(value)) {
    if (lang !== targetLang && text.trim()) {
      return text.trim();
    }
  }

  return "";
}

const TRANSLATE_NO_OPEN = '<span translate="no">';
const TRANSLATE_NO_CLOSE = "</span>";

/** Well-known brand names that should never be auto-translated. */
export const GLOBAL_PROTECTED_BRANDS = [
  "Coca-Cola",
  "Coca Cola",
  "Pepsi",
  "Heineken",
  "Corona",
  "Red Bull",
  "Nutella",
  "Oreo",
  "Fanta",
  "Sprite",
  "Schweppes",
  "Evian",
  "San Pellegrino",
  "Perrier",
];

export interface TranslationBrandProtectionOptions {
  restaurantName?: string;
  additionalBrands?: string[];
  primaryLanguage?: MenuContentLanguage;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isInsideTranslateNoSpan(text: string, index: number): boolean {
  const before = text.slice(0, index);
  const openCount = (before.match(/<span[^>]*translate=["']no["'][^>]*>/gi) ?? []).length;
  const closeCount = (before.match(/<\/span>/gi) ?? []).length;
  return openCount > closeCount;
}

function wrapTranslateNo(inner: string): string {
  return `${TRANSLATE_NO_OPEN}${inner}${TRANSLATE_NO_CLOSE}`;
}

/** Wrap an entire string so DeepL leaves it unchanged during translation. */
export function wrapTextAsNonTranslatable(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  return wrapTranslateNo(trimmed);
}

function replaceOutsideTranslateNoSpans(
  text: string,
  regex: RegExp,
  wrapMatch: (match: string) => string
): string {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const matcher = new RegExp(regex.source, flags);
  let output = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(text)) !== null) {
    const start = match.index;
    const matched = match[0];
    const end = start + matched.length;

    output += text.slice(lastIndex, start);
    output += isInsideTranslateNoSpan(text, start) ? matched : wrapMatch(matched);
    lastIndex = end;
  }

  output += text.slice(lastIndex);
  return output;
}

function wrapQuotedAndBracketedSegments(text: string): string {
  let result = text;

  result = result.replace(/"([^"]+)"/g, (full, inner: string) => {
    if (!inner.trim()) return full;
    return `"${wrapTranslateNo(inner)}"`;
  });

  result = result.replace(/'([^']+)'/g, (full, inner: string) => {
    if (!inner.trim()) return full;
    return `'${wrapTranslateNo(inner)}'`;
  });

  result = result.replace(/\[([^\]]+)\]/g, (full, inner: string) => {
    if (!inner.trim()) return full;
    return `[${wrapTranslateNo(inner)}]`;
  });

  return result;
}

function collectProtectedTerms(options: TranslationBrandProtectionOptions): string[] {
  const terms = new Set<string>();

  for (const brand of GLOBAL_PROTECTED_BRANDS) {
    terms.add(brand.trim());
  }

  for (const brand of options.additionalBrands ?? []) {
    if (brand.trim()) terms.add(brand.trim());
  }

  if (options.restaurantName?.trim()) {
    terms.add(options.restaurantName.trim());
  }

  return [...terms].sort((a, b) => b.length - a.length);
}

/** Wrap quoted segments and brand names so DeepL preserves them via tag_handling=html. */
export function applyTranslationBrandProtection(
  text: string,
  options: TranslationBrandProtectionOptions = {}
): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  let protectedText = wrapQuotedAndBracketedSegments(trimmed);
  const terms = collectProtectedTerms(options);

  for (const term of terms) {
    if (term.length < 2) continue;
    const regex = new RegExp(escapeRegExp(term), "gi");
    protectedText = replaceOutsideTranslateNoSpans(protectedText, regex, wrapTranslateNo);
  }

  return protectedText;
}

/** Remove DeepL preservation spans while keeping the original protected text inside. */
export function stripTranslationBrandProtection(text: string): string {
  if (!text.includes("translate=")) return text;

  let cleaned = text;
  let previous = "";

  while (cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned.replace(
      /<span[^>]*translate=["']no["'][^>]*>([\s\S]*?)<\/span>/gi,
      "$1"
    );
  }

  return cleaned.replace(/<span[^>]*translate=["']no["'][^>]*\/>/gi, "");
}
