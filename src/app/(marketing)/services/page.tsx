import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/marketing/page-hero";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { Layers, Palette, Smartphone, Check } from "lucide-react";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const metadata = marketingPageMetadata({
  title: "Services",
  description:
    "3-Tier Menu Builder, Design Studio, and mobile live previews — the core Menulia platform for modern restaurants.",
  path: "/services",
});

const CORE_SERVICES = [
  {
    icon: Layers,
    title: "3-Tier Menu Builder",
    description:
      "Structure sections, categories, and dishes in a hierarchy that mirrors your kitchen. Rapid-add workflows, dietary tags, and pricing controls keep updates fast.",
    highlights: ["Nested sections & categories", "Bulk dish editing", "Availability toggles"],
  },
  {
    icon: Palette,
    title: "Design Studio",
    description:
      "Fine-tune typography, colors, and layout accents with live hotspot editing. Parent-child theme inheritance keeps your brand consistent across every region.",
    highlights: ["Typography archetypes", "Color hotspot editor", "Brand presets"],
  },
  {
    icon: Smartphone,
    title: "Mobile Live Previews",
    description:
      "See exactly what guests experience on their phones before you publish. Real device framing, swipe carousels, and language switching — no guesswork.",
    highlights: ["In-dashboard phone preview", "Public menu URL", "QR code generator"],
  },
];

const SUPPORTING = [
  "28+ languages with auto-detect",
  "Reservation booking (Premium)",
  "AI menu import (Premium)",
  "Analytics & expense tracking (Premium)",
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="The Menulia platform, built for hospitality"
        subtitle="Three core pillars — structure, design, and preview — plus everything you need to run a modern guest experience."
      />
      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {CORE_SERVICES.map((service, i) => (
              <ScrollReveal key={service.title} delay={i * 100}>
                <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <service.icon className="h-6 w-6 text-accent" aria-hidden />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold tracking-tight">{service.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {service.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight">Also included</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {SUPPORTING.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
          <Link href="/signup" className="mt-8 inline-block">
            <Button variant="primary">Start free</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
