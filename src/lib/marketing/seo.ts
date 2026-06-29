const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menulia.net";

export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Menulia",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description:
      "Premium digital menu and restaurant management platform with design studio, mobile live previews, and multi-language guest experiences.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    publisher: {
      "@type": "Organization",
      name: "Menulia",
      url: SITE_URL,
    },
  };
}

export function marketingPageMetadata({
  title,
  description,
  path = "",
}: {
  title: string;
  description: string;
  path?: string;
}) {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "menulia.net",
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
  };
}
