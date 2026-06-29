import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/marketing/contact-form";
import { LandingDevicePreview } from "@/components/marketing/landing-device-preview";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { marketingPageMetadata } from "@/lib/marketing/seo";
import { Layers, Palette, Smartphone, Check } from "lucide-react";

export const metadata = marketingPageMetadata({
  title: "Menus with Main Character Energy",
  description:
    "menulia.net — digital menus, live design studio, and real-time mobile previews for modern restaurants.",
  path: "/",
});

const FEATURES = [
  {
    icon: Layers,
    title: "3-Tier Menu Builder",
    description:
      "Sections, categories, and dishes in a hierarchy that mirrors your kitchen. Rapid-add keeps updates fast.",
  },
  {
    icon: Palette,
    title: "Live Design Studio",
    description:
      "Typography and layout accents with hotspot editing. One calm workspace for every brand detail.",
  },
  {
    icon: Smartphone,
    title: "Real-time Previews",
    description:
      "See the guest experience on a real device frame before you publish. No PDF pinch-zoom.",
  },
];

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

const DEMO_POINTS = [
  "Drag-and-drop menu structure",
  "One-click design presets",
  "Share via QR or direct link",
];

export default function LandingPage() {
  return (
    <>
      {/* Hero — full viewport */}
      <section
        id="top"
        aria-labelledby="hero-heading"
        className="flex h-[100dvh] min-h-[100dvh] max-h-[100dvh] items-center overflow-hidden border-b border-border bg-white"
      >
        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-8 px-4 pb-6 pt-20 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pb-8 lg:pt-24">
          <div className="min-w-0">
            <p className="air-badge mb-4 border border-border bg-muted text-muted-foreground">
              menulia.net
            </p>
            <h1 id="hero-heading" className="air-page-title text-4xl sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Menus with main character energy
            </h1>
            <p className="air-page-subtitle mt-4 max-w-md text-base sm:text-lg">
              Replace the PDF. Build, style, and preview a mobile-first menu in the same
              workspace your team already trusts.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/signup">
                <Button variant="dark">Start free</Button>
              </Link>
              <a href="#demo">
                <Button variant="light">See how it works</Button>
              </a>
            </div>
          </div>

          <div className="flex min-h-0 items-center justify-center lg:justify-end">
            <LandingDevicePreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        aria-labelledby="features-heading"
        className="border-b border-border bg-white py-24 md:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
            <ScrollReveal direction="left">
              <header className="max-w-md lg:sticky lg:top-28">
                <h2 id="features-heading" className="air-section-title text-3xl sm:text-4xl">
                  Built like the dashboard you log into every day
                </h2>
                <p className="air-page-subtitle mt-3">
                  Same typography scale, same card surfaces, same button physics — because your
                  public menu should feel as considered as your back office.
                </p>
              </header>
            </ScrollReveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {FEATURES.map((feature, index) => (
                <ScrollReveal key={feature.title} delay={index * 90}>
                  <article className="air-card air-card-pad flex gap-4 transition-all duration-200 hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-white">
                      <feature.icon className="h-5 w-5 text-slate-900" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight text-slate-900">
                        {feature.title}
                      </h3>
                      <p className="air-helper mt-1.5 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section
        id="demo"
        aria-labelledby="demo-heading"
        className="border-b border-border bg-muted/40 py-24 md:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal>
              <header>
                <h2 id="demo-heading" className="air-section-title text-3xl sm:text-4xl">
                  Build once. Preview instantly.
                </h2>
                <p className="air-page-subtitle mt-4 max-w-lg">
                  Edit in the dashboard, validate on a phone frame, publish when it is right.
                  Guests get swipeable dishes and language switching — no app download.
                </p>
                <ul className="mt-8 space-y-3">
                  {DEMO_POINTS.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-800">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/menu/santo-sushi" target="_blank" rel="noopener noreferrer" className="mt-8 inline-block">
                  <Button variant="light" isExternal>
                    Open Santo Sushi demo
                  </Button>
                </Link>
              </header>
            </ScrollReveal>

            <ScrollReveal delay={120} direction="right">
              <div className="air-card air-card-pad">
                <p className="air-label mb-4">Workflow</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[12px] border border-border bg-white p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      01 — Structure
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">Menu Builder</p>
                  </div>
                  <div className="rounded-[12px] border border-border bg-white p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      02 — Design
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">Design Studio</p>
                  </div>
                  <div className="rounded-[12px] border border-slate-900 bg-slate-900 p-4 sm:col-span-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
                      03 — Publish
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      Live guest preview on any device
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        aria-labelledby="pricing-heading"
        className="border-b border-border bg-white py-24 md:py-28"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <ScrollReveal>
            <header className="mx-auto max-w-xl text-center">
              <h2 id="pricing-heading" className="air-section-title text-3xl sm:text-4xl">
                Simple launch tiers
              </h2>
              <p className="air-page-subtitle mt-3">Start free. Upgrade when you need more.</p>
            </header>
          </ScrollReveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {PLANS.map((plan, index) => (
              <ScrollReveal key={plan.name} delay={index * 100}>
                <article
                  className={`air-card flex h-full flex-col p-6 md:p-8 ${
                    plan.featured ? "border-slate-900 ring-1 ring-slate-900" : ""
                  }`}
                >
                  {plan.featured && (
                    <span className="mb-4 inline-flex w-fit rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900">{plan.name}</h3>
                  <p className="air-helper mt-1">{plan.description}</p>
                  <p className="mt-5">
                    <span className="text-4xl font-bold tracking-tight text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-800">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="mt-8 block">
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
      <section id="contact" aria-labelledby="contact-heading" className="bg-white py-24 md:py-28">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <ScrollReveal>
            <header className="mb-8 text-center">
              <h2 id="contact-heading" className="air-section-title text-3xl sm:text-4xl">
                Get in touch
              </h2>
              <p className="air-page-subtitle mt-3">
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
