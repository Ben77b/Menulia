import type { Metadata } from "next";
import { LandingPageContent } from "@/components/marketing/landing-page-content";
import { LANDING_COPY, isMarketingLocale, type MarketingLocale } from "@/lib/marketing/locale";
import { marketingPageMetadata } from "@/lib/marketing/seo";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isMarketingLocale(rawLocale)) return {};

  const copy = LANDING_COPY[rawLocale as MarketingLocale];
  return marketingPageMetadata(copy.meta);
}

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isMarketingLocale(rawLocale)) notFound();

  return <LandingPageContent locale={rawLocale as MarketingLocale} />;
}
