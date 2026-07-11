import { notFound } from "next/navigation";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { StickyCta } from "@/components/marketing/sticky-cta";
import { JsonLd } from "@/components/marketing/json-ld";
import { softwareApplicationJsonLd } from "@/lib/marketing/seo";
import { isMarketingLocale, type MarketingLocale } from "@/lib/marketing/locale";

export default async function MarketingLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isMarketingLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as MarketingLocale;

  return (
    <div className="air-landing public-site-grid min-h-screen text-slate-900">
      <JsonLd data={softwareApplicationJsonLd()} />
      <MarketingHeader locale={locale} />
      <main className="scroll-smooth">{children}</main>
      <MarketingFooter locale={locale} />
      <StickyCta locale={locale} />
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }];
}
