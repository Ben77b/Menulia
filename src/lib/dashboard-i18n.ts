export type DashboardLocale = "en" | "es";

export const DEFAULT_DASHBOARD_LOCALE: DashboardLocale = "en";

export const DASHBOARD_LOCALE_COOKIE = "menulia_locale";

const UI_STRINGS: Record<string, Record<DashboardLocale, string>> = {
  "allergens.label": { en: "Allergens", es: "Alérgenos" },
  "allergens.select": { en: "Select allergens", es: "Seleccionar alérgenos" },
  "allergens.euTitle": { en: "EU allergens (14)", es: "Alérgenos UE (14)" },
  "allergens.selectedOne": { en: "1 selected", es: "1 seleccionado" },
  "allergens.selectedMany": { en: "{count} selected", es: "{count} seleccionados" },
  "dish.editTitle": { en: "Edit dish", es: "Editar plato" },
  "dish.visibleOnMenu": { en: "Visible on menu", es: "Visible en el menú" },
  "dish.visibleDescription": {
    en: "Turn off to hide this dish from your public menu when it is out of stock.",
    es: "Desactívelo para ocultar este plato del menú público cuando no haya stock.",
  },
  "dish.photo": { en: "Photo", es: "Foto" },
  "dish.upload": { en: "Upload", es: "Subir" },
  "dish.uploading": { en: "Uploading…", es: "Subiendo…" },
  "dish.price": { en: "Price", es: "Precio" },
  "dish.addPriceVariations": {
    en: "+ Add price variations (sizes, portions…)",
    es: "+ Añadir variaciones de precio (tamaños, raciones…)",
  },
  "dish.priceVariations": { en: "Price variations", es: "Variaciones de precio" },
  "dish.useSinglePrice": { en: "Use single price", es: "Usar precio único" },
  "dish.addAnotherVariation": { en: "+ Add another variation", es: "+ Añadir otra variación" },
  "dish.hidePrice": { en: "Hide price on public menu", es: "Ocultar precio en el menú público" },
  "dish.hidePriceDescription": {
    en: "Show the dish name and description, but omit its price.",
    es: "Muestra el nombre y la descripción, pero omite el precio.",
  },
  "dish.lockTitle": { en: "Do not translate title", es: "No traducir el título" },
  "dish.lockTitleDescription": {
    en: "Protects unique dish names from changing. Description will still be translated.",
    es: "Protege nombres únicos de platos. La descripción seguirá traduciéndose.",
  },
  "dish.description": { en: "Description", es: "Descripción" },
  "dish.aiWrite": { en: "AI write", es: "Redactar con IA" },
  "dish.aiWriting": { en: "Writing…", es: "Redactando…" },
  "dish.filterableTags": { en: "Filterable tags", es: "Etiquetas filtrables" },
  "dish.filterableTagsHelp": {
    en: "Guests can filter the menu by these four options.",
    es: "Los comensales pueden filtrar el menú con estas cuatro opciones.",
  },
  "dish.cancel": { en: "Cancel", es: "Cancelar" },
  "dish.save": { en: "Save dish", es: "Guardar plato" },
  "dish.saving": { en: "Saving…", es: "Guardando…" },
  "builder.sectionNote": { en: "Section note", es: "Nota de sección" },
  "settings.primaryMenuLanguage": {
    en: "Primary menu language",
    es: "Idioma principal del menú",
  },
  "theme.advancedFineTune": {
    en: "Advanced fine-tune",
    es: "Ajuste avanzado",
  },
};

export function isDashboardLocale(value: string | null | undefined): value is DashboardLocale {
  return value === "en" || value === "es";
}

export function dashboardUiString(
  locale: DashboardLocale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const template = UI_STRINGS[key]?.[locale] ?? UI_STRINGS[key]?.en ?? key;
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, String(value)),
    template
  );
}

export function readDashboardLocaleFromCookie(): DashboardLocale {
  if (typeof document === "undefined") return DEFAULT_DASHBOARD_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${DASHBOARD_LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1] ? decodeURIComponent(match[1]) : null;
  return isDashboardLocale(value) ? value : DEFAULT_DASHBOARD_LOCALE;
}
