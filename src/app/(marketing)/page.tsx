import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/marketing/contact-form";
import { LandingDevicePreview } from "@/components/marketing/landing-device-preview";
import { LandingFeaturesSticky } from "@/components/marketing/landing-features-sticky";
import { LandingDemoCanvas } from "@/components/marketing/landing-demo-canvas";
import { LandingFaqAccordion } from "@/components/marketing/landing-faq-accordion";
import { JsonLd } from "@/components/marketing/json-ld";
import { faqPageJsonLd, marketingPageMetadata } from "@/lib/marketing/seo";
import { LANDING_FAQ_ITEMS } from "@/lib/marketing/faq";
import { Check } from "lucide-react";

export const metadata = marketingPageMetadata({
  title: "Menus with Main Character Energy",
  description:
    "menulia.net — digital menus, live design studio, and real-time mobile previews for modern restaurants.",
  path: "/",
});

const PLANS = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    description: "Launch a polished digital menu today.",
    features: ["Menu builder", "Design studio", "Mobile preview", "28+ languages", "QR codes"],
    cta: "Start free",
    href: "/signup",
    featured: false,
  },
  {
    name: "Premium",
    price: "€49",
    period: "/month",
    description: "Reservations, AI import, and analytics for growing teams.",
    features: [
      "Everything in Free",
      "Reservations",
      "AI menu import",
      "Analytics suite",
      "Priority support",
    ],
    cta: "Get Premium",
    href: "/signup",
    featured: true,
  },
];

export default function LandingPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(LANDING_FAQ_ITEMS)} />
      {/* Inverted floating hero capsule */}
      <section
        id="top"
        aria-labelledby="hero-heading"
        className="flex min-h-[100dvh] flex-col bg-white px-4 pb-12 pt-20 sm:px-6 md:pb-16 md:pt-24"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center">
          <div
            className="w-full rounded-[32px] bg-slate-900 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.14)] md:p-12 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:p-14 xl:gap-16"
          >
            <div className="flex flex-col justify-center text-left">
              <h1
                id="hero-heading"
                className="text-5xl font-extrabold tracking-tighter text-white md:text-6xl lg:text-7xl lg:leading-[1.02]"
              >
                Menus with main{" "}
                <span className="air-display-serif">character</span> energy
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 md:mt-8 md:text-xl">
                Replace the PDF with a mobile-first menu your guests actually enjoy — built,
                styled, and previewed in the same workspace your team trusts every day.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-2 md:mt-10">
                <Link href="/signup">
                  <Button variant="light">Start free</Button>
                </Link>
                <a href="#demo">
                  <Button variant="light">See how it works</Button>
                </a>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-center lg:mt-0">
              <LandingDevicePreview tone="dark" className="lg:mx-0 lg:ml-auto" />
            </div>
          </div>
        </div>
      </section>

      <LandingFeaturesSticky />
      <LandingDemoCanvas />

      {/* Pricing */}
      <section
        id="pricing"
        aria-labelledby="pricing-heading"
        className="border-b border-border bg-white py-28 md:py-32"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <header className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Pricing
            </p>
            <h2
              id="pricing-heading"
              className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
            >
              Simple launch <span className="air-display-serif">tiers</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Start free. Upgrade when your restaurant is ready for more.
            </p>
          </header>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={`air-card flex h-full flex-col air-card-pad ${
                  plan.featured ? "border-slate-900 ring-1 ring-slate-900" : ""
                }`}
              >
                {plan.featured && (
                  <span className="mb-5 inline-flex w-fit rounded-full bg-slate-900 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
                <p className="mt-6">
                  <span className="text-5xl font-bold tracking-tight text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </p>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-800">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="mt-10 block">
                  <Button className="w-full" variant={plan.featured ? "dark" : "light"}>
                    {plan.cta}
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <LandingFaqAccordion />

      {/* Contact */}
      <section id="contact" aria-labelledby="contact-heading" className="bg-white py-28 md:py-32">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <header className="mb-10 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Contact
            </p>
            <h2
              id="contact-heading"
              className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
            >
              Get in <span className="air-display-serif">touch</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              Questions about onboarding or Premium? We typically reply within 24 hours.
            </p>
          </header>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
