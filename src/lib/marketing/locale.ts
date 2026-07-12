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

/** Map the current marketing pathname to the equivalent route in another locale. */
export function marketingHrefFromPathname(pathname: string, target: MarketingLocale): string {
  const normalized =
    pathname === "/es" ? "/" : pathname.replace(/^\/es(\/|$)/, "/").replace(/\/$/, "") || "/";

  const segment: "" | "testimonials" =
    normalized === "/testimonials" || normalized.startsWith("/testimonials/")
      ? "testimonials"
      : "";

  return marketingHref(target, segment);
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
  navHowItWorks: string;
  navAnalytics: string;
  navTestimonials: string;
  signIn: string;
  startFree: string;
  stickyCta: string;
  stepsEyebrow: string;
  stepsTitle: string;
  stepsSubtitle: string;
  steps: { title: string; description: string }[];
  analytics: {
    eyebrow: string;
    title: string;
    subtitle: string;
    metrics: { label: string; value: string }[];
    chart: {
      periodLabel: string;
      tickLabels: string[];
      tickIndices: number[];
      qrScans: string;
      traffic: string;
      languageSwitches: string;
    };
  };
  seoRich: {
    title: string;
    paragraphs: string[];
  };
  onlineDiscovery: {
    eyebrow: string;
    title: string;
    intro: string;
    paragraphs: string[];
    bullets: string[];
  };
  inVenue: {
    eyebrow: string;
    title: string;
    intro: string;
    paragraphs: string[];
    bullets: string[];
  };
  ctaBottom: string;
  ctaBottomSubtitle: string;
  footerTagline: string;
  footerProduct: string;
  footerLiveDemo: string;
  footerViewExample: string;
};

export const LANDING_COPY: Record<MarketingLocale, LandingCopy> = {
  en: {
    meta: {
      title: "Interactive Digital Menu for Restaurants | QR Mobile Menu & SEO by Menulia",
      description:
        "Launch an interactive digital menu that ranks in search and delights guests at the table. Restaurant mobile menu, QR code dining experience, and SEO for restaurant menus — free to start.",
      path: "/",
    },
    badge: "Interactive digital menu · Restaurant mobile menu · QR dining",
    headline: "The Interactive Digital Menu That Gets You Discovered — and Loved at the Table",
    subheadline:
      "Menulia turns your dishes into a premium restaurant mobile menu: indexable online for local search, instant at the table via QR, and built for the QR code dining experience guests expect today.",
    ctaPrimary: "Start free",
    ctaSecondary: "View demo",
    navHowItWorks: "How it works",
    navAnalytics: "Analytics",
    navTestimonials: "Restaurants",
    signIn: "Sign in",
    startFree: "Sign up",
    stickyCta: "Ready to launch your digital menu?",
    stepsEyebrow: "How it works",
    stepsTitle: "From blank page to live menu in minutes",
    stepsSubtitle:
      "Everything you need to publish an interactive digital menu — online and in-venue — without hiring an agency.",
    steps: [
      {
        title: "Build your interactive menu",
        description:
          "Add categories, photos, prices, and variations. Your restaurant mobile menu looks premium on every phone.",
      },
      {
        title: "Go multilingual instantly",
        description:
          "Switch languages in one click so international guests explore your QR code dining experience in their language.",
      },
      {
        title: "Share QR & get discovered",
        description:
          "Print table QR codes and publish an SEO-friendly public URL so search engines index your dishes.",
      },
    ],
    analytics: {
      eyebrow: "Real-time performance",
      title: "Real-Time Menu Performance & Analytics",
      subtitle:
        "Track QR menu scans, guest traffic, and language switches as your interactive digital menu scales — the metrics that matter for modern restaurant mobile menus.",
      metrics: [
        { label: "Avg. daily QR scans", value: "~94" },
        { label: "Peak Fri / Sat scans", value: "210" },
        { label: "Language toggles / day", value: "~24" },
      ],
      chart: {
        periodLabel: "Last 30 days",
        tickLabels: ["Mon", "Week 2", "Week 3", "Week 4", "Day 30"],
        tickIndices: [0, 7, 14, 21, 29],
        qrScans: "Table QR scans",
        traffic: "Menu sessions",
        languageSwitches: "Language toggles",
      },
    },
    seoRich: {
      title: "Why an interactive digital menu is your best restaurant marketing asset",
      paragraphs: [
        "Today's diners search before they visit. An interactive digital menu gives Google and Bing crawlable dish names, descriptions, and categories — core signals for SEO for restaurant menus. Instead of a static PDF buried in your website, Menulia publishes a fast, mobile-first experience designed to rank.",
        "Whether you run a fine-dining room or a busy café, a restaurant mobile menu removes friction: guests browse photos, compare options, and understand pricing before they order. Pair that with a polished QR code dining experience at the table and you reduce wait times while increasing average check size.",
        "Menulia is restaurant software online that owners actually use — no code, no designers required. Create digital menu free, customize your brand, translate for tourists, and download print-ready QR codes. Your menu becomes a living channel that works 24/7 on the web and in your dining room.",
      ],
    },
    onlineDiscovery: {
      eyebrow: "Outside the restaurant",
      title: "Fuera del local — Online discovery that brings hungry guests to your door",
      intro:
        "Before a guest ever walks in, they search. Menulia's indexable menu infrastructure puts your dishes where discovery happens.",
      paragraphs: [
        "Every public Menulia menu ships with clean URLs, structured content, and fast load times — the foundation of SEO for restaurant menus. Local search users can find your restaurant mobile menu, browse categories, and compare dishes from Google on their phone.",
        "Share the same link on Instagram, Google Business, TripAdvisor, or your website embed. One interactive digital menu, everywhere your brand appears online — always up to date when you change a price in the dashboard.",
      ],
      bullets: [
        "Indexable dish pages for local and organic search",
        "Lightning-fast mobile layout for on-the-go browsers",
        "Embeddable menu for your existing website",
        "Automatic updates — no re-printing PDFs",
      ],
    },
    inVenue: {
      eyebrow: "At the table",
      title: "En la mesa — A premium in-venue UX guests feel immediately",
      intro:
        "The QR scan is the first impression. Menulia loads a responsive, multi-language layout in seconds — no app download, no login.",
      paragraphs: [
        "Guests scan, land on your branded restaurant mobile menu, and explore categories with smooth scrolling and clear typography. Switch languages without asking staff. View variations, add-ons, and descriptions without waiting for a printed carta.",
        "Staff spend less time explaining the menu and more time on hospitality. You control the experience from the dashboard — update tonight's special and every table sees it instantly.",
      ],
      bullets: [
        "Instant QR load — no app install required",
        "Multi-language toggle for international tables",
        "Category navigation designed for thumbs",
        "Premium design that matches your brand",
      ],
    },
    ctaBottom: "Launch your interactive digital menu",
    ctaBottomSubtitle:
      "Join restaurants using Menulia for online discovery and an unforgettable QR code dining experience.",
    footerTagline:
      "Interactive digital menus for restaurants — discoverable online, delightful at the table.",
    footerProduct: "Product",
    footerLiveDemo: "Live demo",
    footerViewExample: "View sample menu",
  },
  es: {
    meta: {
      title: "Menú Digital para Restaurantes | Carta QR Interactiva y SEO con Menulia",
      description:
        "Crea un menú digital para restaurantes que posiciona en buscadores y enamora en sala. Carta digital QR interactiva, diseño de cartas para bares y posicionamiento SEO de restaurantes.",
      path: "/es",
    },
    badge: "Menú digital · Carta QR interactiva · Mobile-first",
    headline: "El Menú Digital que Te Hace Visible Online — y Brilla en Cada Mesa",
    subheadline:
      "Menulia convierte tu carta en un menú digital para restaurantes de alto nivel: indexable en Google, instantáneo con QR en mesa, y pensado para la carta digital QR interactiva que tus clientes ya esperan.",
    ctaPrimary: "Empezar gratis",
    ctaSecondary: "Ver ejemplo",
    navHowItWorks: "Cómo funciona",
    navAnalytics: "Analítica",
    navTestimonials: "Restaurantes",
    signIn: "Iniciar sesión",
    startFree: "Registrarse",
    stickyCta: "¿Listo para lanzar tu menú digital?",
    stepsEyebrow: "Cómo funciona",
    stepsTitle: "De cero a carta publicada en minutos",
    stepsSubtitle:
      "Todo lo que necesitas para publicar un menú digital para restaurantes — online y en sala — sin agencias ni código.",
    steps: [
      {
        title: "Crea tu carta interactiva",
        description:
          "Añade categorías, fotos, precios y variaciones. Tu carta digital QR se ve premium en cualquier móvil.",
      },
      {
        title: "Multilingüe al instante",
        description:
          "Cambia de idioma con un clic para que turistas disfruten la carta digital QR interactiva en su lengua.",
      },
      {
        title: "Comparte QR y gana visibilidad",
        description:
          "Imprime QR en mesa y publica una URL optimizada para que los buscadores indexen tus platos.",
      },
    ],
    analytics: {
      eyebrow: "Rendimiento en tiempo real",
      title: "Rendimiento y Analítica del Menú en Tiempo Real",
      subtitle:
        "Monitoriza escaneos QR, tráfico de comensales e idiomas seleccionados mientras tu menú digital para restaurantes crece.",
      metrics: [
        { label: "Escaneos QR diarios (media)", value: "~94" },
        { label: "Pico vie / sáb", value: "210" },
        { label: "Cambios de idioma / día", value: "~24" },
      ],
      chart: {
        periodLabel: "Últimos 30 días",
        tickLabels: ["Lun", "Sem. 2", "Sem. 3", "Sem. 4", "Día 30"],
        tickIndices: [0, 7, 14, 21, 29],
        qrScans: "Escaneos QR en mesa",
        traffic: "Sesiones del menú",
        languageSwitches: "Cambios de idioma",
      },
    },
    seoRich: {
      title: "Por qué un menú digital para restaurantes es tu mejor activo de marketing",
      paragraphs: [
        "Hoy el cliente busca antes de reservar. Un menú digital para restaurantes ofrece a Google nombres de platos, descripciones y categorías indexables — señales clave para el posicionamiento SEO de restaurantes. En lugar de un PDF estático, Menulia publica una carta digital QR interactiva rápida y mobile-first.",
        "Tanto si gestionas un restaurante como un bar, una carta digital QR interactiva elimina fricción: el cliente explora fotos, compara platos y entiende precios antes de pedir. En mesa, la experiencia QR es instantánea — menos esperas, más ticket medio.",
        "Menulia es software online que los dueños usan de verdad: sin código ni diseñadores. Crea menú digital gratis, personaliza tu marca, traduce para turistas y descarga QR listos para imprimir. Tu carta trabaja 24/7 en la web y en sala.",
      ],
    },
    onlineDiscovery: {
      eyebrow: "Fuera del local",
      title: "Fuera del Local — Descubrimiento online que trae comensales",
      intro:
        "Antes de cruzar la puerta, buscan. La infraestructura indexable de Menulia coloca tus platos donde ocurre el descubrimiento.",
      paragraphs: [
        "Cada menú público incluye URLs limpias, contenido estructurado y carga ultrarrápida — la base del posicionamiento SEO de restaurantes. Usuarios locales encuentran tu menú digital para restaurantes desde Google en el móvil.",
        "Comparte el mismo enlace en Instagram, Google Business o tu web. Una sola carta digital QR interactiva, siempre actualizada cuando cambias un precio en el panel.",
      ],
      bullets: [
        "Platos indexables para búsqueda local y orgánica",
        "Diseño mobile ultrarrápido para navegación en calle",
        "Embed para tu web actual",
        "Actualizaciones instantáneas — sin reimprimir PDFs",
      ],
    },
    inVenue: {
      eyebrow: "En la mesa",
      title: "En la Mesa — UX premium que el cliente nota al instante",
      intro:
        "El escaneo QR es la primera impresión. Menulia carga un diseño responsive y multilingüe en segundos — sin app ni registro.",
      paragraphs: [
        "El cliente escanea, llega a tu carta con tu marca y explora categorías con scroll fluido y tipografía clara. Cambia de idioma sin pedir ayuda. Ve variaciones y descripciones sin esperar al camarero.",
        "El equipo dedica menos tiempo a explicar la carta y más a la hospitalidad. Actualiza el especial del día y todas las mesas lo ven al momento.",
      ],
      bullets: [
        "Carga QR instantánea — sin instalar app",
        "Selector multilingüe para mesas internacionales",
        "Navegación por categorías pensada para móvil",
        "Diseño premium acorde a tu marca",
      ],
    },
    ctaBottom: "Lanza tu menú digital interactivo",
    ctaBottomSubtitle:
      "Únete a restaurantes que usan Menulia para visibilidad online y una carta QR inolvidable en sala.",
    footerTagline:
      "Menús digitales para restaurantes — visibles online, memorables en mesa.",
    footerProduct: "Producto",
    footerLiveDemo: "Demo en vivo",
    footerViewExample: "Ver menú de ejemplo",
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
        "Explore restaurants powered by Menulia — live interactive digital menus and QR restaurant mobile menus.",
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
        "Descubre restaurantes con menú digital para restaurantes en Menulia — cartas QR interactivas en vivo.",
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
