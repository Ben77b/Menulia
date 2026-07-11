import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/marketing/json-ld";
import { DEMO_MENU_SLUG } from "@/components/marketing/footer";
import {
  LANDING_COPY,
  type MarketingLocale,
} from "@/lib/marketing/locale";
import {
  ArrowRight,
  Languages,
  QrCode,
  ShieldCheck,
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

      <section
        id="top"
        aria-labelledby="hero-heading"
        className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-6 md:pb-32 md:pt-36"
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

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg md:mt-8">
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
              className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
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

      <section aria-labelledby="compliance-heading" className="px-4 pb-24 sm:px-6 md:pb-32">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-[#22c55e]/25 bg-white px-6 py-8 text-center shadow-[0_4px_24px_rgba(34,197,94,0.06)] sm:flex-row sm:gap-6 sm:px-10 sm:text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#22c55e]/10 text-[#22c55e] ring-1 ring-[#22c55e]/25 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
              <ShieldCheck className="h-7 w-7" aria-hidden />
            </span>
            <div>
              <h2 id="compliance-heading" className="text-lg font-semibold text-slate-900">
                {copy.complianceTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.complianceBody}</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button size="lg" className={cn("min-w-[200px] rounded-xl neon-btn-primary")}>
                {copy.ctaBottom}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
