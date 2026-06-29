import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/marketing/contact-form";
import { marketingPageMetadata } from "@/lib/marketing/seo";
import { Layers, Palette, Smartphone, Check, Sparkles, ArrowRight } from "lucide-react";

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
      "Structure sections, categories, and dishes in minutes. Rapid-add workflows keep your menu current without the PDF scramble.",
  },
  {
    icon: Palette,
    title: "Live Design Studio",
    description:
      "Typography, colors, and layout accents with hotspot editing. Your brand looks intentional on every screen.",
  },
  {
    icon: Smartphone,
    title: "Real-time Previews",
    description:
      "See exactly what guests experience on their phones before you publish. No guesswork, no pinch-zoom disasters.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    description: "Launch a beautiful digital menu today.",
    features: ["Menu builder", "Design studio", "Mobile preview", "28+ languages", "QR codes"],
    cta: "Start free",
    href: "/signup",
    highlighted: false,
    span: "lg:col-span-1",
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
    highlighted: true,
    span: "lg:col-span-2",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section
        id="top"
        className="relative overflow-hidden border-b border-border bg-background"
        aria-labelledby="hero-heading"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.03),_transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              menulia.net
            </p>
            <h1
              id="hero-heading"
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
            >
              Menus with{" "}
              <span className="text-accent">main character energy</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Replace the PDF. Ship a mobile-first menu your guests actually enjoy — built,
              styled, and previewed in one calm workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button variant="primary">
                  Start free
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <a href="#demo">
                <Button variant="light">See live demo</Button>
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="rounded-[2rem] border border-border bg-card p-2 shadow-[var(--shadow-air-ambient)]">
              <div className="aspect-[9/19] overflow-hidden rounded-[1.6rem] bg-muted">
                <iframe
                  src="/menu/la-calle-tacos"
                  title="Menulia menu preview"
                  className="h-full w-full border-0"
                />
              </div>
            </div>
            <div className="absolute -right-2 -top-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-lg">
              Live preview
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border bg-card py-20" aria-labelledby="features-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="max-w-2xl">
            <h2 id="features-heading" className="text-3xl font-bold tracking-tight text-slate-900">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-3 text-muted-foreground">
              Three core pillars — structure, design, and preview — in one Apple-clean workflow.
            </p>
          </header>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-background p-6 transition hover:shadow-[var(--shadow-air-ambient)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-card">
                  <feature.icon className="h-5 w-5 text-slate-700" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="border-b border-border bg-background py-20" aria-labelledby="demo-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <header>
              <h2 id="demo-heading" className="text-3xl font-bold tracking-tight text-slate-900">
                Build once. Preview instantly.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Edit your menu in the dashboard, then watch changes render on a real device frame.
                Guests get swipeable dishes, dietary filters, and language switching — no app
                download required.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Drag-and-drop menu structure",
                  "One-click design presets",
                  "Share via QR or direct link",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </header>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-air-ambient)]">
              <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Dashboard → Live preview</span>
                <span className="rounded-full bg-muted px-2 py-0.5">Real-time</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Menu Builder
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">Add sections & dishes</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Design Studio
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">Tune colors & fonts</p>
                </div>
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    Guest preview
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Publish when it looks perfect — not when the PDF exports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border bg-card py-20" aria-labelledby="pricing-heading">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <header className="text-center">
            <h2 id="pricing-heading" className="text-3xl font-bold tracking-tight text-slate-900">
              Simple launch tiers
            </h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more.</p>
          </header>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={`flex flex-col rounded-2xl border p-6 lg:p-8 ${
                  plan.highlighted
                    ? "border-accent/40 bg-gradient-to-br from-accent/5 via-card to-background shadow-[0_8px_40px_rgba(255,107,74,0.1)] lg:col-span-2"
                    : "border-border bg-background"
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="mt-8 block">
                  <Button className="w-full" variant={plan.highlighted ? "primary" : "light"}>
                    {plan.cta}
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-background py-20" aria-labelledby="contact-heading">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <header className="mb-8 text-center">
            <h2 id="contact-heading" className="text-3xl font-bold tracking-tight text-slate-900">
              Get in touch
            </h2>
            <p className="mt-3 text-muted-foreground">
              Questions about onboarding or Premium? We typically reply within 24 hours.
            </p>
          </header>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
