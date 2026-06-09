import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/marketing/page-hero";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { Check } from "lucide-react";

export const metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for menulia.io. Free digital menus. Premium adds reservations, AI import, and analytics.",
};

const PLANS = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    features: [
      "Interactive digital menu",
      "28+ languages with auto-detect",
      "Custom branding & logo",
      "Burger menu links",
      "Operating hours display",
      "Guest preview from dashboard",
    ],
    cta: "Start free",
    href: "/onboarding",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "€49",
    period: "/month",
    features: [
      "Everything in Free",
      "Reservation booking engine",
      "AI Menu Importer",
      "Reservation CRM",
      "Analytics & seasonality charts",
      "Expense ledger tracking",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    href: "/onboarding",
    highlighted: true,
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
          <div className="grid gap-8 md:grid-cols-2">
            {PLANS.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 150}>
                <div
                  className={`h-full rounded-2xl border p-8 transition hover:-translate-y-1 hover:shadow-xl ${
                    plan.highlighted
                      ? "border-emerald-brand bg-emerald-brand-light/30 shadow-lg"
                      : "border-border bg-white"
                  }`}
                >
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <p className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-text-secondary">{plan.period}</span>
                  </p>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="mt-8 block">
                    <Button className="w-full" variant={plan.highlighted ? "primary" : "outline"} size="lg">
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
