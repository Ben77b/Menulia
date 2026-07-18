import type { MenuContentLanguage } from "@/lib/menu-content-languages";
import { stripTranslationBrandProtection } from "@/lib/localized-text";

type GlossaryEntry = Record<MenuContentLanguage, string>;

/**
 * Static UI / menu-framework glossary.
 * Exact-match lookup (case-insensitive) skips DeepL for known terms.
 */
const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  // Weekdays (full)
  { en: "Monday", es: "Lunes", fr: "Lundi", de: "Montag" },
  { en: "Tuesday", es: "Martes", fr: "Mardi", de: "Dienstag" },
  { en: "Wednesday", es: "Miércoles", fr: "Mercredi", de: "Mittwoch" },
  { en: "Thursday", es: "Jueves", fr: "Jeudi", de: "Donnerstag" },
  { en: "Friday", es: "Viernes", fr: "Vendredi", de: "Freitag" },
  { en: "Saturday", es: "Sábado", fr: "Samedi", de: "Samstag" },
  { en: "Sunday", es: "Domingo", fr: "Dimanche", de: "Sonntag" },
  // Weekdays (abbr)
  { en: "Mon", es: "Lun", fr: "Lun", de: "Mo" },
  { en: "Tue", es: "Mar", fr: "Mar", de: "Di" },
  { en: "Wed", es: "Mié", fr: "Mer", de: "Mi" },
  { en: "Thu", es: "Jue", fr: "Jeu", de: "Do" },
  { en: "Fri", es: "Vie", fr: "Ven", de: "Fr" },
  { en: "Sat", es: "Sáb", fr: "Sam", de: "Sa" },
  { en: "Sun", es: "Dom", fr: "Dim", de: "So" },
  // Common category / section titles
  { en: "Appetizers", es: "Entrantes", fr: "Entrées", de: "Vorspeisen" },
  { en: "Starters", es: "Entrantes", fr: "Entrées", de: "Vorspeisen" },
  { en: "Mains", es: "Principales", fr: "Plats", de: "Hauptgerichte" },
  { en: "Main courses", es: "Platos principales", fr: "Plats principaux", de: "Hauptgerichte" },
  { en: "Sides", es: "Guarniciones", fr: "Accompagnements", de: "Beilagen" },
  { en: "Desserts", es: "Postres", fr: "Desserts", de: "Desserts" },
  { en: "Drinks", es: "Bebidas", fr: "Boissons", de: "Getränke" },
  { en: "Beverages", es: "Bebidas", fr: "Boissons", de: "Getränke" },
  { en: "Food", es: "Comida", fr: "Nourriture", de: "Essen" },
  { en: "Specials", es: "Especiales", fr: "Spécialités", de: "Specials" },
  { en: "Today's specials", es: "Especiales del día", fr: "Spécialités du jour", de: "Tagesgerichte" },
  { en: "Kids", es: "Niños", fr: "Enfants", de: "Kinder" },
  { en: "Kids menu", es: "Menú infantil", fr: "Menu enfant", de: "Kindermenü" },
  { en: "Breakfast", es: "Desayuno", fr: "Petit-déjeuner", de: "Frühstück" },
  { en: "Lunch", es: "Comida", fr: "Déjeuner", de: "Mittagessen" },
  { en: "Dinner", es: "Cena", fr: "Dîner", de: "Abendessen" },
  { en: "Wine", es: "Vino", fr: "Vin", de: "Wein" },
  { en: "Beer", es: "Cerveza", fr: "Bière", de: "Bier" },
  { en: "Cocktails", es: "Cócteles", fr: "Cocktails", de: "Cocktails" },
  { en: "Coffee", es: "Café", fr: "Café", de: "Kaffee" },
  { en: "Tea", es: "Té", fr: "Thé", de: "Tee" },
  { en: "Soft drinks", es: "Refrescos", fr: "Boissons gazeuses", de: "Erfrischungsgetränke" },
  { en: "Salads", es: "Ensaladas", fr: "Salades", de: "Salate" },
  { en: "Soups", es: "Sopas", fr: "Soupes", de: "Suppen" },
  { en: "Pasta", es: "Pasta", fr: "Pâtes", de: "Pasta" },
  { en: "Pizza", es: "Pizza", fr: "Pizza", de: "Pizza" },
  { en: "Seafood", es: "Mariscos", fr: "Fruits de mer", de: "Meeresfrüchte" },
  { en: "Meat", es: "Carnes", fr: "Viandes", de: "Fleisch" },
  { en: "Fish", es: "Pescado", fr: "Poisson", de: "Fisch" },
  { en: "Vegetarian", es: "Vegetariano", fr: "Végétarien", de: "Vegetarisch" },
  { en: "Vegan", es: "Vegano", fr: "Végan", de: "Vegan" },
  { en: "Gluten-Free", es: "Sin gluten", fr: "Sans gluten", de: "Glutenfrei" },
  { en: "Gluten free", es: "Sin gluten", fr: "Sans gluten", de: "Glutenfrei" },
  { en: "Tapas", es: "Tapas", fr: "Tapas", de: "Tapas" },
  { en: "Sharing", es: "Para compartir", fr: "À partager", de: "Zum Teilen" },
  { en: "Extras", es: "Extras", fr: "Suppléments", de: "Extras" },
  { en: "Sauces", es: "Salsas", fr: "Sauces", de: "Saucen" },
  { en: "Cheeses", es: "Quesos", fr: "Fromages", de: "Käse" },
  { en: "Deli", es: "Charcutería", fr: "Charcuterie", de: "Feinkost" },
  // Baseline chrome / system phrases
  { en: "Open Hours", es: "Horario", fr: "Horaires", de: "Öffnungszeiten" },
  { en: "Opening hours", es: "Horario de apertura", fr: "Horaires d'ouverture", de: "Öffnungszeiten" },
  { en: "Allergens", es: "Alérgenos", fr: "Allergènes", de: "Allergene" },
  { en: "Filter dishes", es: "Filtrar platos", fr: "Filtrer les plats", de: "Gerichte filtern" },
  { en: "Clear", es: "Limpiar", fr: "Effacer", de: "Zurücksetzen" },
  { en: "Location", es: "Ubicación", fr: "Emplacement", de: "Standort" },
  { en: "Contact", es: "Contacto", fr: "Contact", de: "Kontakt" },
  { en: "Menu", es: "Carta", fr: "Menu", de: "Speisekarte" },
];

function normalizeGlossaryKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const GLOSSARY_LOOKUP = (() => {
  const map = new Map<string, GlossaryEntry>();
  for (const entry of GLOSSARY_ENTRIES) {
    for (const form of Object.values(entry)) {
      const key = normalizeGlossaryKey(form);
      if (!key || map.has(key)) continue;
      map.set(key, entry);
    }
  }
  return map;
})();

/** Exact glossary hit for a known UI/menu framework term, or null. */
export function lookupGlossaryTranslation(
  text: string,
  targetLang: MenuContentLanguage
): string | null {
  const entry = GLOSSARY_LOOKUP.get(normalizeGlossaryKey(text));
  if (!entry) return null;
  const translated = entry[targetLang]?.trim();
  return translated || null;
}

const ISOLATED_WRAP_PREFIX = "Restaurant menu item name:";

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unescapeHtmlText(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

/**
 * Short standalone titles/tags lack sentence context for DeepL.
 * Single words and ultra-short phrases (≤3 words, ≤48 chars) qualify.
 */
export function isIsolatedMenuTerm(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 48) return false;
  if (/\d/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 3;
}

/**
 * Frame an isolated term so DeepL receives culinary sentence context.
 * The instruction span is marked non-translatable; only the term is translated.
 */
export function wrapIsolatedMenuTerm(term: string): string {
  const safe = escapeHtmlText(term.trim());
  return `<span translate="no">${ISOLATED_WRAP_PREFIX}</span> ${safe}`;
}

/** Strip the contextual frame and return only the translated term. */
export function unwrapIsolatedMenuTerm(translated: string, original: string): string {
  const cleaned = unescapeHtmlText(
    stripTranslationBrandProtection(translated).trim()
  );

  if (!cleaned) return original.trim();

  const withoutPrefix = cleaned
    .replace(new RegExp(`^${ISOLATED_WRAP_PREFIX}\\s*`, "i"), "")
    .trim();

  const afterColon = cleaned.match(/:\s*(.+)$/);
  const candidate = (afterColon?.[1] ?? withoutPrefix).trim();

  const unquoted = candidate
    .replace(/^["«»„“”']+|["«»„“”']+$/g, "")
    .trim();

  if (unquoted) return unquoted;
  if (withoutPrefix && withoutPrefix !== cleaned) return withoutPrefix;
  return original.trim();
}
