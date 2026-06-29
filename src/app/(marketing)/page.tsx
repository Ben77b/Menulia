import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/marketing/contact-form";
import { LandingDevicePreview } from "@/components/marketing/landing-device-preview";
import { LandingFeaturesSticky } from "@/components/marketing/landing-features-sticky";
import { LandingDemoCanvas } from "@/components/marketing/landing-demo-canvas";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { marketingPageMetadata } from "@/lib/marketing/seo";
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
      {/* Hero — editorial, cinematic */}
      <section
        id="top"
        aria-labelledby="hero-heading"
        className="border-b border-border bg-white pt-24 pb-20 md:pt-28 md:pb-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1
              id="hero-heading"
              className="text-5xl font-extrabold tracking-tighter text-slate-900 md:text-7xl md:leading-[1.02]"
            >
              Menus with main character energy
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:mt-8 md:text-xl">
              Replace the PDF with a mobile-first menu your guests actually enjoy — built, styled,
              and previewed in the same workspace your team trusts every day.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2 md:mt-10">
              <Link href="/signup">
                <Button variant="dark">Start free</Button>
              </Link>
              <a href="#demo">
                <Button variant="light">See how it works</Button>
              </a>
            </div>
          </div>

          <ScrollReveal delay={160} className="mt-14 md:mt-20">
            <LandingDevicePreview />
          </ScrollReveal>
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
          <ScrollReveal>
            <header className="mx-auto max-w-2xl text-center">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Pricing
              </p>
              <h2
                id="pricing-heading"
                className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
              >
                Simple launch tiers
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Start free. Upgrade when your restaurant is ready for more.
              </p>
            </header>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {PLANS.map((plan, index) => (
              <ScrollReveal key={plan.name} delay={index * 100}>
                <article
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
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" aria-labelledby="contact-heading" className="bg-white py-28 md:py-32">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <ScrollReveal>
            <header className="mb-10 text-center">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Contact
              </p>
              <h2
                id="contact-heading"
                className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
              >
                Get in touch
              </h2>
              <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
                Questions about onboarding or Premium? We typically reply within 24 hours.
              </p>
            </header>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <ContactForm />
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
