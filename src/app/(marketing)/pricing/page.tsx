import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/marketing/page-hero";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { Check, Sparkles } from "lucide-react";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const metadata = marketingPageMetadata({
  title: "Pricing",
  description: "Simple, transparent pricing for menulia.net. Free digital menus. Premium adds reservations, AI import, and analytics.",
  path: "/pricing",
});

const PLANS = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    description: "Everything you need to launch a beautiful digital menu.",
    features: [
      "3-Tier Menu Builder",
      "Design Studio basics",
      "Mobile live preview",
      "28+ languages",
      "Custom branding & QR codes",
    ],
    cta: "Start free",
    href: "/signup",
    highlighted: false,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    name: "Premium",
    price: "€49",
    period: "/month",
    description: "Reservations, AI import, and analytics for growing restaurants.",
    features: [
      "Everything in Free",
      "Reservation booking engine",
      "AI Menu Importer",
      "Analytics & seasonality",
      "Expense ledger",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    href: "/signup",
    highlighted: true,
    span: "md:col-span-2 md:row-span-2",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Multi-location groups and custom integrations.",
    features: ["Dedicated onboarding", "SLA & support", "Custom domains", "API access"],
    cta: "Contact sales",
    href: "/contact",
    highlighted: false,
    span: "md:col-span-1 md:row-span-1",
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        subtitle="Start free. Upgrade when you're ready for reservations and analytics."
      />
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid auto-rows-fr gap-4 md:grid-cols-3 md:grid-rows-2">
            {PLANS.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 100} className={plan.span}>
                <article
                  className={`flex h-full flex-col rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-lg md:p-8 ${
                    plan.highlighted
                      ? "border-accent/40 bg-gradient-to-br from-accent/5 via-card to-card shadow-[0_8px_40px_rgba(255,107,74,0.12)]"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      Most popular
                    </span>
                  )}
                  <header>
                    <h2 className="text-xl font-semibold tracking-tight">{plan.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                    <p className="mt-4">
                      <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground">{plan.period}</span>
                      )}
                    </p>
                  </header>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="mt-8 block">
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? "primary" : "light"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
