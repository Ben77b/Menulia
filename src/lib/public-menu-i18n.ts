import type { LanguageCode } from "./languages";
import { LANGUAGES } from "./languages";

export type PublicMenuLocale = LanguageCode;

/** Languages shown in the public menu header dropdown */
export const HEADER_LANGUAGES = LANGUAGES;

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    openHours: "Open Hours",
    locationContact: "Location & Contact",
    filterTitle: "Filter dishes",
    allergens: "Allergens",
    noDishes: "No dishes in this category.",
    noFilterMatch: "No dishes match the selected filters.",
    links: "Links",
    poweredBy: "Powered by Menulia.net",
    language: "Language",
    allDishes: "All dishes",
  },
  es: {
    openHours: "Horario",
    locationContact: "Ubicación y contacto",
    filterTitle: "Filtrar platos",
    allergens: "Alérgenos",
    noDishes: "No hay platos en esta categoría.",
    noFilterMatch: "Ningún plato coincide con los filtros.",
    links: "Enlaces",
    poweredBy: "Powered by Menulia.net",
    language: "Idioma",
    allDishes: "Todos los platos",
  },
  de: {
    openHours: "Öffnungszeiten",
    locationContact: "Standort & Kontakt",
    filterTitle: "Gerichte filtern",
    allergens: "Allergene",
    noDishes: "Keine Gerichte in dieser Kategorie.",
    noFilterMatch: "Keine Gerichte entsprechen den Filtern.",
    links: "Links",
    poweredBy: "Powered by Menulia.net",
    language: "Sprache",
    allDishes: "Alle Gerichte",
  },
  fr: {
    openHours: "Horaires",
    locationContact: "Adresse & contact",
    filterTitle: "Filtrer les plats",
    allergens: "Allergènes",
    noDishes: "Aucun plat dans cette catégorie.",
    noFilterMatch: "Aucun plat ne correspond aux filtres.",
    links: "Liens",
    poweredBy: "Powered by Menulia.net",
    language: "Langue",
    allDishes: "Tous les plats",
  },
  it: {
    openHours: "Orari",
    locationContact: "Posizione e contatti",
    filterTitle: "Filtra piatti",
    allergens: "Allergeni",
    noDishes: "Nessun piatto in questa categoria.",
    noFilterMatch: "Nessun piatto corrisponde ai filtri.",
    links: "Link",
    poweredBy: "Powered by Menulia.net",
    language: "Lingua",
    allDishes: "Tutti i piatti",
  },
};

export function menuUiString(locale: PublicMenuLocale, key: string): string {
  return UI_STRINGS[locale]?.[key] ?? UI_STRINGS.en[key] ?? key;
}
