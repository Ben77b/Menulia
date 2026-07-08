export type MenuContentLanguage = "en" | "es";

export const MENU_CONTENT_LANGUAGES: {
  code: MenuContentLanguage;
  label: string;
  flag: string;
  deeplCode: string;
}[] = [
  { code: "en", label: "English", flag: "🇬🇧", deeplCode: "EN" },
  { code: "es", label: "Spanish", flag: "🇪🇸", deeplCode: "ES" },
];

export function menuSourceLanguageStorageKey(restaurantId: string): string {
  return `menulia:menu-source-lang:${restaurantId}`;
}

export function getMenuSourceLanguage(restaurantId: string | undefined): MenuContentLanguage {
  if (!restaurantId || typeof window === "undefined") return "en";
  const stored = localStorage.getItem(menuSourceLanguageStorageKey(restaurantId));
  return stored === "es" ? "es" : "en";
}

export function setMenuSourceLanguage(
  restaurantId: string,
  language: MenuContentLanguage
): void {
  localStorage.setItem(menuSourceLanguageStorageKey(restaurantId), language);
}

export function getMenuContentLanguageMeta(code: MenuContentLanguage) {
  return MENU_CONTENT_LANGUAGES.find((language) => language.code === code) ?? MENU_CONTENT_LANGUAGES[0];
}

export function deeplCodeToMenuLanguage(code: string | undefined): MenuContentLanguage {
  const normalized = code?.trim().toUpperCase();
  if (normalized === "ES") return "es";
  return "en";
}

export function menuEditorLanguageStorageKey(restaurantId: string): string {
  return menuSourceLanguageStorageKey(restaurantId);
}

export function getMenuEditorLanguage(restaurantId: string | undefined): MenuContentLanguage {
  return getMenuSourceLanguage(restaurantId);
}

export function setMenuEditorLanguage(
  restaurantId: string,
  language: MenuContentLanguage
): void {
  setMenuSourceLanguage(restaurantId, language);
}

export function otherMenuContentLanguage(code: MenuContentLanguage): MenuContentLanguage {
  return code === "en" ? "es" : "en";
}
