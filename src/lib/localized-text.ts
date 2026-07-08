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
  const existing = isLocalizedTextRecord(current)
    ? current
    : { [baseLang]: resolveLocalizedText(current, baseLang, baseLang) };

  return {
    ...existing,
    [baseLang]: normalizeText(existing[baseLang]) || resolveLocalizedText(current, baseLang, baseLang),
    [nextLang]: nextText,
  };
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
  targetLang: string
): string {
  if (typeof value === "string") return value.trim();
  if (!isLocalizedTextRecord(value)) return "";

  for (const [lang, text] of Object.entries(value)) {
    if (lang !== targetLang && text.trim()) {
      return text.trim();
    }
  }

  const fallback = Object.values(value).find((text) => text.trim());
  return fallback?.trim() ?? "";
}
