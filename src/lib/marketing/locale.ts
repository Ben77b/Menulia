export const MARKETING_LOCALES = ["en", "es"] as const;

export type MarketingLocale = (typeof MARKETING_LOCALES)[number];

export const DEFAULT_MARKETING_LOCALE: MarketingLocale = "en";

export function isMarketingLocale(value: string): value is MarketingLocale {
  return MARKETING_LOCALES.includes(value as MarketingLocale);
}

/** Public URL path (no /en prefix for English). */
export function marketingHref(locale: MarketingLocale, segment: "" | "testimonials" = ""): string {
  const suffix = segment ? `/${segment}` : "";
  return locale === "es" ? `/es${suffix}` : suffix || "/";
}

export function alternateMarketingLocale(locale: MarketingLocale): MarketingLocale {
  return locale === "en" ? "es" : "en";
}

export type LandingCopy = {
  meta: {
    title: string;
    description: string;
    path: string;
  };
  badge: string;
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  stepsEyebrow: string;
  stepsTitle: string;
  stepsSubtitle: string;
  steps: { title: string; description: string }[];
  complianceTitle: string;
  complianceBody: string;
  ctaBottom: string;
  navHowItWorks: string;
  navTestimonials: string;
  signIn: string;
  startFree: string;
  footerTagline: string;
  footerProduct: string;
  footerLiveDemo: string;
  footerViewExample: string;
  stickyCta: string;
  langSwitch: string;
};

export const LANDING_COPY: Record<MarketingLocale, LandingCopy> = {
  en: {
    meta: {
      title: "Digital Menu for Restaurants | Smart QR Menus by Menulia",
      description:
        "Create a digital menu free with Menulia — QR code menu software for restaurants. Build, translate, and share your online restaurant menu in minutes.",
      path: "/",
    },
    badge: "Digital menus · QR codes · Multi-language · EU allergen compliant",
    headline: "The Digital Menu Your Restaurant Deserves | Smart QR Cards by Menulia",
    subheadline:
      "Create digital menu free, launch a QR code menu, and run your restaurant software online — interactive, elegant, and allergen-ready in under 5 minutes.",
    ctaPrimary: "Start free",
    ctaSecondary: "View demo",
    stepsEyebrow: "How it works",
    stepsTitle: "Three steps. Menu live.",
    stepsSubtitle:
      "Built for restaurant owners who want a premium digital menu without the technical hassle.",
    steps: [
      {
        title: "Add your dishes",
        description: "Full control over prices, categories, and variations.",
      },
      {
        title: "Translate instantly",
        description: "Switch languages in one click with our optimized translation engine.",
      },
      {
        title: "Download your QR",
        description: "Print and share your menu with guests immediately.",
      },
    ],
    complianceTitle: "100% compliant with EU 14-allergen regulations",
    complianceBody:
      "Menulia includes the EU Reg. 1169/2011 allergen engine so your digital menu meets food-information requirements from day one.",
    ctaBottom: "Create my menu now",
    navHowItWorks: "How it works",
    navTestimonials: "Restaurants",
    signIn: "Sign in",
    startFree: "Start free",
    footerTagline:
      "Premium digital menus, multi-language QR experiences, and EU allergen compliance for modern restaurants.",
    footerProduct: "Product",
    footerLiveDemo: "Live demo",
    footerViewExample: "View sample menu",
    stickyCta: "Ready to launch your menu?",
    langSwitch: "Español",
  },
  es: {
    meta: {
      title: "Menú Digital para Restaurantes | Carta QR Inteligente por Menulia",
      description:
        "Crea menú digital gratis con Menulia — carta QR para restaurante y software online. Digitaliza tu carta de bar en minutos, multilingüe y con alérgenos UE.",
      path: "/es",
    },
    badge: "Menú digital · Carta QR · Multilingüe · Alérgenos UE",
    headline: "El Menú Digital que tu Restaurante Merece | Carta QR Inteligente por Menulia",
    subheadline:
      "Crea menú digital gratis, lanza tu carta QR para restaurante y digitaliza la carta de bar — interactiva, elegante y con alérgenos en menos de 5 minutos.",
    ctaPrimary: "Empezar gratis",
    ctaSecondary: "Ver ejemplo",
    stepsEyebrow: "Cómo funciona",
    stepsTitle: "Tres pasos. Menú listo.",
    stepsSubtitle:
      "Diseñado para dueños de restaurante que quieren lanzar rápido sin sacrificar calidad.",
    steps: [
      {
        title: "Sube tus platos",
        description: "Control total de precios, categorías y variaciones.",
      },
      {
        title: "Traduce al instante",
        description: "Cambia entre idiomas con un solo clic con nuestro motor optimizado.",
      },
      {
        title: "Descarga tu QR",
        description: "Imprime y comparte tu menú al instante con tus comensales.",
      },
    ],
    complianceTitle: "100% conforme con la normativa española y los 14 alérgenos UE",
    complianceBody:
      "Menulia incluye el motor de alérgenos según el Reglamento UE 1169/2011, para que tu menú cumpla con la legislación alimentaria desde el primer día.",
    ctaBottom: "Crear mi menú ahora",
    navHowItWorks: "Cómo funciona",
    navTestimonials: "Restaurantes",
    signIn: "Iniciar sesión",
    startFree: "Empezar gratis",
    footerTagline:
      "Menús digitales premium, multilingües y conformes con la normativa de alérgenos UE.",
    footerProduct: "Producto",
    footerLiveDemo: "Demo en vivo",
    footerViewExample: "Ver menú de ejemplo",
    stickyCta: "¿Listo para lanzar tu menú?",
    langSwitch: "English",
  },
};

export type TestimonialsCopy = {
  meta: {
    title: string;
    description: string;
    path: string;
  };
  eyebrow: string;
  title: string;
  subtitle: string;
  empty: string;
  viewMenu: string;
};

export const TESTIMONIALS_COPY: Record<MarketingLocale, TestimonialsCopy> = {
  en: {
    meta: {
      title: "Restaurants Using Menulia | Digital Menu Directory",
      description:
        "Explore restaurants powered by Menulia — live digital menus, QR code menus, and smart online restaurant software.",
      path: "/testimonials",
    },
    eyebrow: "Live menus",
    title: "Restaurants on Menulia",
    subtitle:
      "Discover real digital menus built with Menulia — each link opens a live guest-facing QR menu.",
    empty: "New restaurant menus will appear here as owners publish their profiles.",
    viewMenu: "View live menu",
  },
  es: {
    meta: {
      title: "Restaurantes con Menulia | Directorio de Menús Digitales",
      description:
        "Descubre restaurantes con menú digital en Menulia — cartas QR en vivo y software online para hostelería.",
      path: "/es/testimonials",
    },
    eyebrow: "Menús en vivo",
    title: "Restaurantes en Menulia",
    subtitle:
      "Explora menús digitales reales creados con Menulia — cada enlace abre la carta QR publicada.",
    empty: "Los nuevos menús aparecerán aquí cuando los restaurantes publiquen su perfil.",
    viewMenu: "Ver menú en vivo",
  },
};
