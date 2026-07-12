import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/marketing/json-ld";
import { DEMO_MENU_SLUG } from "@/components/marketing/footer";
import { MarketingAnalyticsChart } from "@/components/marketing/marketing-analytics-chart";
import { LANDING_COPY, type MarketingLocale } from "@/lib/marketing/locale";
import {
  ArrowRight,
  Check,
  Globe,
  Languages,
  QrCode,
  Smartphone,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_ICONS = [UtensilsCrossed, Languages, QrCode] as const;

type LandingPageContentProps = {
  locale: MarketingLocale;
};

export function LandingPageContent({ locale }: LandingPageContentProps) {
  const copy = LANDING_COPY[locale];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: copy.meta.title,
          description: copy.meta.description,
          url: `https://www.menulia.net${copy.meta.path}`,
          inLanguage: locale === "es" ? "es-ES" : "en-US",
        }}
      />

      {/* Hero */}
      <section
        id="top"
        aria-labelledby="hero-heading"
        className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 md:pb-20 md:pt-36"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(34,197,94,0.12),transparent)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-6 inline-flex items-center rounded-full border border-[#22c55e]/30 bg-[#22c55e]/8 px-4 py-1.5 text-xs font-medium tracking-wide text-[#16a34a]">
            {copy.badge}
          </p>

          <h1
            id="hero-heading"
            className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl md:leading-[1.12]"
          >
            {copy.headline}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg md:mt-8">
            {copy.subheadline}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/signup">
              <Button size="lg" className={cn("min-w-[180px] rounded-xl neon-btn-primary")}>
                {copy.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/menu/${DEMO_MENU_SLUG}`} target="_blank" rel="noopener">
              <Button size="lg" className={cn("min-w-[180px] rounded-xl neon-btn-outline")}>
                {copy.ctaSecondary}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section
        id="analytics"
        aria-labelledby="analytics-heading"
        className="border-t border-slate-200/80 px-4 py-16 sm:px-6 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#22c55e]">
              {copy.analytics.eyebrow}
            </p>
            <h2
              id="analytics-heading"
              className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
            >
              {copy.analytics.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {copy.analytics.subtitle}
            </p>
          </header>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {copy.analytics.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-center shadow-sm"
              >
                <p className="text-2xl font-bold tracking-tight text-[#22c55e]">{metric.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <MarketingAnalyticsChart labels={copy.analytics.chart} locale={locale} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="como-funciona"
        aria-labelledby="steps-heading"
        className="border-t border-slate-200/80 px-4 py-20 sm:px-6 md:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#22c55e]">
              {copy.stepsEyebrow}
            </p>
            <h2
              id="steps-heading"
              className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl"
            >
              {copy.stepsTitle}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              {copy.stepsSubtitle}
            </p>
          </header>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {copy.steps.map((step, index) => {
              const Icon = STEP_ICONS[index] ?? UtensilsCrossed;
              return (
                <article
                  key={step.title}
                  className="group rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[#22c55e]/30 hover:shadow-[0_8px_32px_rgba(34,197,94,0.08)]"
                >
                  <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22c55e]/10 text-[#22c55e] ring-1 ring-[#22c55e]/20 transition-colors group-hover:bg-[#22c55e]/15 group-hover:shadow-[0_0_16px_rgba(34,197,94,0.2)]">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {locale === "es" ? "Paso" : "Step"} {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEO rich text */}
      <section
        aria-labelledby="seo-rich-heading"
        className="border-t border-slate-200/80 px-4 py-20 sm:px-6 md:py-28"
      >
        <article className="mx-auto max-w-3xl">
          <h2
            id="seo-rich-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl"
          >
            {copy.seoRich.title}
          </h2>
          <div className="mt-8 space-y-6 text-base leading-relaxed text-slate-600">
            {copy.seoRich.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </article>
      </section>

      {/* Online discovery */}
      <section
        id="online-discovery"
        aria-labelledby="online-heading"
        className="border-t border-slate-200/80 px-4 py-20 sm:px-6 md:py-28"
      >
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#16a34a]">
              <Globe className="h-3.5 w-3.5" aria-hidden />
              {copy.onlineDiscovery.eyebrow}
            </span>
            <h2
              id="online-heading"
              className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl"
            >
              {copy.onlineDiscovery.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{copy.onlineDiscovery.intro}</p>
          </div>

          <div className="space-y-6">
            {copy.onlineDiscovery.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {paragraph}
              </p>
            ))}
            <ul className="space-y-3">
              {copy.onlineDiscovery.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-slate-700 sm:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]" aria-hidden />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* In-venue UX */}
      <section
        id="in-venue"
        aria-labelledby="invenue-heading"
        className="border-t border-slate-200/80 px-4 py-20 sm:px-6 md:py-28"
      >
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
          <div className="order-2 space-y-6 lg:order-1">
            {copy.inVenue.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {paragraph}
              </p>
            ))}
            <ul className="space-y-3">
              {copy.inVenue.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-slate-700 sm:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]" aria-hidden />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#22c55e]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#16a34a]">
              <Smartphone className="h-3.5 w-3.5" aria-hidden />
              {copy.inVenue.eyebrow}
            </span>
            <h2
              id="invenue-heading"
              className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl"
            >
              {copy.inVenue.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{copy.inVenue.intro}</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-24 sm:px-6 md:pb-32">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#22c55e]/25 bg-white px-6 py-12 text-center shadow-[0_4px_24px_rgba(34,197,94,0.06)] sm:px-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            {copy.ctaBottom}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {copy.ctaBottomSubtitle}
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className={cn("min-w-[220px] rounded-xl neon-btn-primary")}>
                {copy.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
