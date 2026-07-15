export type DashboardLocale = "en" | "es";

export const DASHBOARD_LOCALES: DashboardLocale[] = ["en", "es"];

export const DEFAULT_DASHBOARD_LOCALE: DashboardLocale = "en";

/** Dashboard UI locale — separate from marketing `menulia_locale`. */
export const DASHBOARD_LOCALE_COOKIE = "menulia_dashboard_locale";

const UI_STRINGS: Record<string, Record<DashboardLocale, string>> = {
  "locale.toggleLabel": { en: "Dashboard language", es: "Idioma del panel" },
  "nav.home": { en: "Home", es: "Inicio" },
  "nav.menuBuilder": { en: "Menu Builder", es: "Editor de menú" },
  "nav.shareMenu": { en: "Share the Menu", es: "Compartir menú" },
  "nav.settings": { en: "Settings", es: "Ajustes" },
  "nav.designStudio": { en: "Design Studio", es: "Estudio de diseño" },
  "nav.viewLiveMenu": { en: "View Live Menu", es: "Ver menú en vivo" },
  "nav.workspace": { en: "Restaurant workspace", es: "Espacio de trabajo" },
  "nav.loadingWorkspace": { en: "Loading workspace…", es: "Cargando espacio de trabajo…" },
  "nav.selectRestaurant": { en: "Select Restaurant", es: "Seleccionar restaurante" },
  "nav.loading": { en: "Loading...", es: "Cargando..." },
  "nav.restaurantsOne": { en: "1 restaurant", es: "1 restaurante" },
  "nav.restaurantsMany": { en: "{count} restaurants", es: "{count} restaurantes" },
  "nav.addRestaurant": { en: "＋ Add New Restaurant", es: "＋ Añadir restaurante" },
  "nav.onboardingLockout": {
    en: "Dashboard locked until your first restaurant is created.",
    es: "El panel está bloqueado hasta que crees tu primer restaurante.",
  },
  "nav.accountSettings": { en: "Account settings", es: "Ajustes de cuenta" },
  "home.welcome": { en: "Welcome back", es: "Bienvenido de nuevo" },
  "home.managing": { en: "Managing", es: "Gestionando" },
  "home.viewLiveSite": { en: "View Live Site", es: "Ver sitio en vivo" },
  "home.loading": { en: "Loading...", es: "Cargando..." },
  "home.noRestaurant": { en: "No restaurant selected", es: "Ningún restaurante seleccionado" },
  "home.statCategories": { en: "Total Menu Categories", es: "Categorías del menú" },
  "home.statDishes": { en: "Total Active Dishes", es: "Platos activos" },
  "home.statLinks": { en: "Dynamic Link Count", es: "Enlaces dinámicos" },
  "home.getStarted": { en: "Get Started", es: "Primeros pasos" },
  "home.getStartedSubtitle": {
    en: "Complete these steps to launch your digital menu.",
    es: "Completa estos pasos para publicar tu menú digital.",
  },
  "home.stepCategoriesTitle": { en: "Build your categories", es: "Crea tus categorías" },
  "home.stepCategoriesDesc": {
    en: "Create menu categories to organize your dishes",
    es: "Organiza tus platos en categorías del menú",
  },
  "home.stepThemeTitle": { en: "Design your theme", es: "Diseña tu tema" },
  "home.stepThemeDesc": {
    en: "Customize colors, fonts, and branding",
    es: "Personaliza colores, fuentes y marca",
  },
  "home.stepQrTitle": { en: "Download your QR code", es: "Descarga tu código QR" },
  "home.stepQrDesc": {
    en: "Get a printable QR code for your menu",
    es: "Obtén un código QR imprimible para tu menú",
  },
  "share.pageTitle": { en: "Share the Menu", es: "Compartir menú" },
  "share.pageSubtitle": {
    en: "QR codes, direct links, and website embeds — everything you need to put your menu in guests' hands.",
    es: "Códigos QR, enlaces directos e incrustaciones web: todo lo que necesitas para poner tu menú en manos de tus clientes.",
  },
  "share.loading": { en: "Loading share tools…", es: "Cargando herramientas para compartir…" },
  "share.qrTitle": { en: "Menu QR Code", es: "Código QR del menú" },
  "share.qrDescription": {
    en: "Print this code for tables, menus, or signage. Guests scan to open your live digital menu.",
    es: "Imprime este código para mesas, cartas o señalización. Los clientes escanean para abrir tu menú digital.",
  },
  "share.directLinkTitle": { en: "Direct Link", es: "Enlace directo" },
  "share.directLinkDescription": {
    en: "Share this URL in messages, social posts, or your Google Business profile.",
    es: "Comparte esta URL en mensajes, redes sociales o tu perfil de Google Business.",
  },
  "share.embedTitle": { en: "Website Embed", es: "Incrustar en web" },
  "share.embedDescription": {
    en: "Paste this iframe into your website builder or HTML to embed your live menu.",
    es: "Pega este iframe en tu web o HTML para incrustar tu menú en vivo.",
  },
  "share.footerNote": {
    en: "All share tools point to the same live public menu. Updates in Menu Builder appear instantly — no need to regenerate links or QR codes.",
    es: "Todas las herramientas apuntan al mismo menú público en vivo. Los cambios en el editor se publican al instante, sin regenerar enlaces ni códigos QR.",
  },
  "settings.pageTitle": { en: "Restaurant Settings", es: "Ajustes del restaurante" },
  "settings.tab.general": { en: "General", es: "General" },
  "settings.tab.hours": { en: "Hours & Location", es: "Horario y ubicación" },
  "settings.tab.social": { en: "Social & Links", es: "Redes y enlaces" },
  "settings.tab.languages": { en: "Languages", es: "Idiomas" },
  "settings.tab.danger": { en: "Danger Zone", es: "Zona de peligro" },
  "settings.menuLanguagesTitle": { en: "Menu Languages", es: "Idiomas del menú" },
  "settings.menuLanguagesDescription": {
    en: "Choose the primary language you write your menu in. The builder and public menu default to this language first.",
    es: "Elige el idioma principal en el que escribes tu menú. El editor y el menú público usan este idioma por defecto.",
  },
  "settings.secondaryLanguage": {
    en: "Secondary language for quick translations:",
    es: "Idioma secundario para traducciones rápidas:",
  },
  "settings.savePrimaryLanguage": { en: "Save primary language", es: "Guardar idioma principal" },
  "settings.primaryLanguageSaved": {
    en: "Primary menu language saved",
    es: "Idioma principal del menú guardado",
  },
  "settings.translateTitle": { en: "Auto-translate with DeepL", es: "Traducción automática con DeepL" },
  "settings.translateDescription": {
    en: "DeepL detects each item automatically. Select languages to add — skip your primary ({language}).",
    es: "DeepL detecta cada elemento automáticamente. Selecciona idiomas a añadir — omite tu idioma principal ({language}).",
  },
  "settings.translateInto": { en: "Translate into", es: "Traducir a" },
  "settings.translateMenu": { en: "Translate Menu", es: "Traducir menú" },
  "settings.translateSuccess": { en: "Menu translated successfully", es: "Menú traducido correctamente" },
  "settings.selectLanguage": {
    en: "Select at least one language.",
    es: "Selecciona al menos un idioma.",
  },
  "settings.primaryMenuLanguage": {
    en: "Primary menu language",
    es: "Idioma principal del menú",
  },
  "branding.pageTitle": { en: "Design Studio", es: "Estudio de diseño" },
  "branding.showPrices": { en: "Show Prices", es: "Mostrar precios" },
  "branding.showPricesDesc": {
    en: "Display dish prices on the public menu",
    es: "Muestra los precios en el menú público",
  },
  "branding.showDescriptions": { en: "Show Descriptions", es: "Mostrar descripciones" },
  "branding.showDescriptionsDesc": {
    en: "Display dish descriptions beneath each item name",
    es: "Muestra descripciones debajo de cada plato",
  },
  "branding.showImages": { en: "Show Images", es: "Mostrar imágenes" },
  "branding.showImagesDesc": {
    en: "Display dish photos in carousel and stacked layouts",
    es: "Muestra fotos en diseños carrusel y en lista",
  },
  "branding.showDietary": { en: "Show Dietary Info", es: "Mostrar información dietética" },
  "branding.showDietaryDesc": {
    en: "Show dietary tags on dishes and the filter bar in the footer area",
    es: "Muestra etiquetas dietéticas y la barra de filtros en el pie",
  },
  "branding.saveChanges": { en: "Save Changes", es: "Guardar cambios" },
  "branding.saving": { en: "Saving...", es: "Guardando..." },
  "branding.saved": { en: "Saved!", es: "Guardado" },
  "builder.pageTitle": { en: "Menu Builder", es: "Editor de menú" },
  "builder.pageSubtitle": {
    en: "Drag to reorder sections, tap any dish to edit details, or toggle visibility instantly.",
    es: "Arrastra para reordenar secciones, toca cualquier plato para editarlo o cambia la visibilidad al instante.",
  },
  "builder.rapidAddPlaceholder": { en: "+ Add a dish…", es: "+ Agregar plato…" },
  "builder.addDish": { en: "Add Dish", es: "Agregar plato" },
  "builder.addCategory": { en: "Add Category", es: "Agregar categoría" },
  "builder.sectionNotePlaceholder": {
    en: 'Optional note (e.g. "Served with miso soup")',
    es: 'Nota opcional (p. ej. "Servido con sopa miso")',
  },
  "builder.categorySubtitle": {
    en: "Category subtitle / description",
    es: "Subtítulo / descripción de la categoría",
  },
  "builder.tapForDetails": {
    en: "Tap for photo, description, and tags",
    es: "Toca para foto, descripción y etiquetas",
  },
  "account.pageTitle": { en: "Account Settings", es: "Ajustes de cuenta" },
  "account.pageSubtitle": {
    en: "Manage your personal profile, security, and billing",
    es: "Gestiona tu perfil, seguridad y facturación",
  },
  "common.copied": { en: "Copied!", es: "Copiado" },
  "common.copyLink": { en: "Copy Link", es: "Copiar enlace" },
  "common.copyEmbed": { en: "Copy Embed Code", es: "Copiar código de incrustación" },
  "common.saving": { en: "Saving...", es: "Guardando..." },
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
  "dish.hasPortions": {
    en: "Has multiple sizes or portions?",
    es: "¿Tiene varios tamaños o raciones?",
  },
  "dish.hasPortionsDescription": {
    en: "Offer different sizes or portions, each with its own price.",
    es: "Ofrece distintos tamaños o raciones, cada uno con su precio.",
  },
  "dish.portionsAndPrices": { en: "Portions and prices", es: "Raciones y precios" },
  "dish.portionNamePlaceholder": { en: "Small, 1 Bottle…", es: "Pequeño, 1 botella…" },
  "dish.addSizeOption": { en: "Add size option", es: "Añadir tamaño" },
  "dish.removePortion": { en: "Remove portion", es: "Eliminar ración" },
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
  "builder.reorderMode": { en: "Reorder Mode", es: "Modo reordenar" },
  "builder.reorderModeOn": { en: "Reorder On", es: "Reordenar activo" },
  "builder.reorderDishes": { en: "Reorder dishes", es: "Reordenar platos" },
  "builder.doneReordering": { en: "Done reordering", es: "Terminar reordenar" },
  "builder.reorderModeHint": {
    en: "Use the arrows to move dishes. Scrolling is paused while reordering.",
    es: "Usa las flechas para mover platos. El desplazamiento está pausado mientras reordenas.",
  },
  "builder.categoriesMenu": { en: "Categories", es: "Categorías" },
  "builder.hidden": { en: "Hidden", es: "Oculto" },
  "builder.visible": { en: "Visible", es: "Visible" },
  "builder.dishesCount": { en: "{count} dishes", es: "{count} platos" },
  "builder.categoriesCount": { en: "{count} categories", es: "{count} categorías" },
  "builder.actions.title": { en: "Actions", es: "Acciones" },
  "builder.actions.editDetails": { en: "Edit details", es: "Editar detalles" },
  "builder.actions.renameCategory": { en: "Rename category", es: "Renombrar categoría" },
  "builder.actions.showOnMenu": { en: "Show on menu", es: "Mostrar en el menú" },
  "builder.actions.hideFromMenu": { en: "Hide from menu", es: "Ocultar del menú" },
  "builder.actions.duplicate": { en: "Duplicate item", es: "Duplicar elemento" },
  "builder.actions.delete": { en: "Delete item", es: "Eliminar elemento" },
  "builder.actions.deleteCategory": { en: "Delete category", es: "Eliminar categoría" },
  "builder.actions.deleteSection": { en: "Delete section", es: "Eliminar sección" },
  "builder.actions.layoutStacked": { en: "Stacked", es: "Lista" },
  "builder.actions.layoutCarousel": { en: "Carousel layout", es: "Diseño carrusel" },
  "builder.layout.carousel": { en: "Carousel", es: "Carrusel" },
  "builder.layout.stacked": { en: "Stacked", es: "Lista" },
  "builder.layout.stackedLeft": { en: "Stacked (Image Left)", es: "Lista (img. izq.)" },
  "builder.actions.more": { en: "More actions", es: "Más acciones" },
  "share.qrColor": { en: "QR code color", es: "Color del código QR" },
  "share.transparentBg": { en: "Transparent background", es: "Fondo transparente" },
  "share.transparentBgDescription": {
    en: "Export PNG with a clear background for stickers and print overlays.",
    es: "Exporta PNG con fondo transparente para pegatinas e impresión.",
  },
  "share.downloadQr": { en: "Download QR code", es: "Descargar código QR" },
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
  try {
    const safeKey = typeof key === "string" ? key.trim() : "";
    const safeLocale = isDashboardLocale(locale) ? locale : DEFAULT_DASHBOARD_LOCALE;

    if (!safeKey) return "";

    const entry = UI_STRINGS[safeKey];
    const template =
      (entry && (entry[safeLocale] ?? entry[DEFAULT_DASHBOARD_LOCALE])) ?? safeKey;

    if (!vars || typeof vars !== "object") return template;

    return Object.entries(vars).reduce((text, [name, value]) => {
      if (name) {
        return text.replace(new RegExp(`\\{${name}\\}`, "g"), String(value ?? ""));
      }
      return text;
    }, template);
  } catch {
    return typeof key === "string" ? key : "";
  }
}

export function readDashboardLocaleFromCookie(): DashboardLocale {
  try {
    if (typeof document === "undefined") return DEFAULT_DASHBOARD_LOCALE;
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${DASHBOARD_LOCALE_COOKIE}=([^;]*)`)
    );
    const value = match?.[1] ? decodeURIComponent(match[1]) : null;
    return isDashboardLocale(value) ? value : DEFAULT_DASHBOARD_LOCALE;
  } catch {
    return DEFAULT_DASHBOARD_LOCALE;
  }
}
