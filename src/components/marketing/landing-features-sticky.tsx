"use client";

import { Layers, Palette, Smartphone } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

const FEATURES = [
  {
    icon: Layers,
    step: "01",
    title: "3-Tier Menu Builder",
    description:
      "Sections, categories, and dishes in a hierarchy that mirrors how your kitchen actually runs. Rapid-add keeps service updates fast.",
  },
  {
    icon: Palette,
    step: "02",
    title: "Live Design Studio",
    description:
      "Typography, spacing, and layout accents with hotspot editing. Every brand detail lives in one calm, considered workspace.",
  },
  {
    icon: Smartphone,
    step: "03",
    title: "Real-time Previews",
    description:
      "Validate the guest experience on a real device frame before you publish. No PDF pinch-zoom. No guesswork.",
  },
];

export function LandingFeaturesSticky() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="border-b border-border bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 md:py-32">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ScrollReveal direction="fade">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Platform
              </p>
              <h2
                id="features-heading"
                className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl md:leading-[1.1]"
              >
                The Blueprint of <span className="air-display-serif">Taste</span>
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
                Structure, design, and preview — three pillars that turn your menu from a static
                document into a living guest experience.
              </p>
            </ScrollReveal>
          </div>

          <div className="flex flex-col gap-8 md:gap-12 lg:py-8">
            {FEATURES.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 100}>
                <article className="air-card air-card-pad flex min-h-[240px] flex-col justify-center transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] md:min-h-[280px]">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white">
                      <feature.icon className="h-5 w-5 text-slate-900" aria-hidden />
                    </div>
                    <span className="text-xs font-medium tracking-widest text-muted-foreground">
                      {feature.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
