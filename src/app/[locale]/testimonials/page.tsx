import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TestimonialsGrid } from "@/components/marketing/testimonials-grid";
import {
  TESTIMONIALS_COPY,
  isMarketingLocale,
  type MarketingLocale,
} from "@/lib/marketing/locale";
import { fetchPublicRestaurantProfiles } from "@/lib/marketing/public-restaurants";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isMarketingLocale(rawLocale)) return {};

  const copy = TESTIMONIALS_COPY[rawLocale as MarketingLocale];
  return marketingPageMetadata(copy.meta);
}

export default async function TestimonialsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isMarketingLocale(rawLocale)) notFound();

  const restaurants = await fetchPublicRestaurantProfiles();

  return (
    <TestimonialsGrid locale={rawLocale as MarketingLocale} restaurants={restaurants} />
  );
}
