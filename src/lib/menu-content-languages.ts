export type MenuContentLanguage = "en" | "es" | "fr" | "de";

export const DEFAULT_PRIMARY_LANGUAGE: MenuContentLanguage = "es";

/** Guest auto-translate roster — Mallorca core tourism languages only */
export const GUEST_AUTO_TRANSLATE_LANGUAGES: {
  code: MenuContentLanguage;
  label: string;
  flag: string;
  deeplCode: string;
}[] = [
  { code: "en", label: "English", flag: "🇬🇧", deeplCode: "EN" },
  { code: "es", label: "Spanish", flag: "🇪🇸", deeplCode: "ES" },
  { code: "fr", label: "French", flag: "🇫🇷", deeplCode: "FR" },
  { code: "de", label: "German", flag: "🇩🇪", deeplCode: "DE" },
];

/** Canonical content languages (builder + public) — same 4-language matrix */
export const MENU_CONTENT_LANGUAGES = GUEST_AUTO_TRANSLATE_LANGUAGES;

const MENU_CONTENT_LANGUAGE_CODES = new Set<string>(
  MENU_CONTENT_LANGUAGES.map((language) => language.code)
);

export function isMenuContentLanguage(value: unknown): value is MenuContentLanguage {
  return typeof value === "string" && MENU_CONTENT_LANGUAGE_CODES.has(value);
}

export function isGuestAutoTranslateLanguage(
  value: unknown
): value is MenuContentLanguage {
  return isMenuContentLanguage(value);
}

export function getMenuContentLanguageMeta(code: MenuContentLanguage) {
  return MENU_CONTENT_LANGUAGES.find((language) => language.code === code) ?? MENU_CONTENT_LANGUAGES[0];
}

export function deeplCodeToMenuLanguage(code: string | undefined): MenuContentLanguage {
  const normalized = code?.trim().toUpperCase() ?? "";

  if (normalized === "ES" || normalized.startsWith("ES-")) return "es";
  if (normalized === "FR" || normalized.startsWith("FR-")) return "fr";
  if (normalized === "DE" || normalized.startsWith("DE-")) return "de";
  if (normalized === "EN" || normalized.startsWith("EN-")) return "en";

  return "en";
}

export function normalizePrimaryLanguage(value: unknown): MenuContentLanguage {
  return isMenuContentLanguage(value) ? value : DEFAULT_PRIMARY_LANGUAGE;
}

/**
 * Map browser navigator.language to a guest auto-translate locale.
 * Returns null when outside the 4-language roster (caller should keep primary, no API).
 */
export function detectGuestMenuLanguage(
  navigatorLanguage: string | undefined | null
): MenuContentLanguage | null {
  const raw = (navigatorLanguage ?? "").trim().toLowerCase();
  if (!raw) return null;

  const primary = raw.split("-")[0] ?? raw;
  if (isGuestAutoTranslateLanguage(primary)) return primary;
  if (isGuestAutoTranslateLanguage(raw)) return raw;
  return null;
}

/** Preferred inline-editor secondary when only one counterpart field is shown. */
export function getSecondaryLanguage(primary: MenuContentLanguage): MenuContentLanguage {
  if (primary === "en") return "es";
  return "en";
}

export function getTranslationTargetLanguages(
  primary: MenuContentLanguage
): MenuContentLanguage[] {
  return MENU_CONTENT_LANGUAGES.filter((language) => language.code !== primary).map(
    (language) => language.code
  );
}
