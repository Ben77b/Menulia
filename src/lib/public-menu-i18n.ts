import {
  MENU_CONTENT_LANGUAGES,
  getSecondaryLanguage,
  isMenuContentLanguage,
  type MenuContentLanguage,
} from "./menu-content-languages";

export type PublicMenuLocale = MenuContentLanguage;

/** Languages available on the public menu content + UI toggle */
export const PUBLIC_MENU_LANGUAGES = MENU_CONTENT_LANGUAGES.map((language) => ({
  code: language.code,
  label: language.label,
  flag: language.flag,
}));

/** Languages shown in the public menu header dropdown */
export const HEADER_LANGUAGES = PUBLIC_MENU_LANGUAGES;

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    openHours: "Open Hours",
    locationContact: "Location & Contact",
    filterTitle: "Filter dishes",
    clearFilters: "Clear",
    allergens: "Allergens",
    noDishes: "No dishes in this category.",
    noFilterMatch: "No dishes match the selected filters.",
    links: "Links",
    poweredBy: "Powered by Menulia.net",
    language: "Language",
    allDishes: "All dishes",
    disclaimerLink: "Allergen & Liability Disclaimer",
  },
  es: {
    openHours: "Horario",
    locationContact: "Ubicación y contacto",
    filterTitle: "Filtrar platos",
    clearFilters: "Limpiar",
    allergens: "Alérgenos",
    noDishes: "No hay platos en esta categoría.",
    noFilterMatch: "Ningún plato coincide con los filtros.",
    links: "Enlaces",
    poweredBy: "Powered by Menulia.net",
    language: "Idioma",
    allDishes: "Todos los platos",
    disclaimerLink: "Aviso de Alérgenos y Responsabilidad",
  },
  de: {
    openHours: "Öffnungszeiten",
    locationContact: "Standort & Kontakt",
    filterTitle: "Gerichte filtern",
    clearFilters: "Zurücksetzen",
    allergens: "Allergene",
    noDishes: "Keine Gerichte in dieser Kategorie.",
    noFilterMatch: "Keine Gerichte entsprechen den Filtern.",
    links: "Links",
    poweredBy: "Powered by Menulia.net",
    language: "Sprache",
    allDishes: "Alle Gerichte",
    disclaimerLink: "Allergen- & Haftungsausschluss",
  },
  fr: {
    openHours: "Horaires",
    locationContact: "Adresse & contact",
    filterTitle: "Filtrer les plats",
    clearFilters: "Effacer",
    allergens: "Allergènes",
    noDishes: "Aucun plat dans cette catégorie.",
    noFilterMatch: "Aucun plat ne correspond aux filtres.",
    links: "Liens",
    poweredBy: "Powered by Menulia.net",
    language: "Langue",
    allDishes: "Tous les plats",
    disclaimerLink: "Avertissement allergènes et responsabilité",
  },
  it: {
    openHours: "Orari",
    locationContact: "Posizione e contatti",
    filterTitle: "Filtra piatti",
    clearFilters: "Cancella",
    allergens: "Allergeni",
    noDishes: "Nessun piatto in questa categoria.",
    noFilterMatch: "Nessun piatto corrisponde ai filtri.",
    links: "Link",
    poweredBy: "Powered by Menulia.net",
    language: "Lingua",
    allDishes: "Tutti i piatti",
    disclaimerLink: "Avvertenza allergeni e responsabilità",
  },
  pt: {
    openHours: "Horário",
    locationContact: "Localização e contacto",
    filterTitle: "Filtrar pratos",
    clearFilters: "Limpar",
    allergens: "Alergénios",
    noDishes: "Não há pratos nesta categoria.",
    noFilterMatch: "Nenhum prato corresponde aos filtros.",
    links: "Ligações",
    poweredBy: "Powered by Menulia.net",
    language: "Idioma",
    allDishes: "Todos os pratos",
    disclaimerLink: "Aviso de Alergénios e Responsabilidade",
  },
};

export function getSecondaryMenuLocale(primary: PublicMenuLocale): PublicMenuLocale {
  return getSecondaryLanguage(primary);
}

/** Legal/footer links only support en | es — never throws. */
export function normalizePublicMenuLocale(locale: unknown): "en" | "es" {
  try {
    return locale === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}

export function isPublicMenuLocale(value: unknown): value is PublicMenuLocale {
  return isMenuContentLanguage(value);
}

export function menuUiString(locale: PublicMenuLocale, key: string): string {
  try {
    const safeKey = typeof key === "string" ? key.trim() : "";
    if (!safeKey) return "";

    const localeStrings = UI_STRINGS[locale] ?? UI_STRINGS.en;
    return localeStrings?.[safeKey] ?? UI_STRINGS.en?.[safeKey] ?? safeKey;
  } catch {
    return typeof key === "string" ? key : "";
  }
}
