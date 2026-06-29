"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "structure",
    label: "Structure",
    title: "Menu Builder",
    description: "Organize sections, categories, and dishes in minutes.",
  },
  {
    id: "design",
    label: "Design",
    title: "Design Studio",
    description: "Tune typography, colors, and layout accents live.",
  },
  {
    id: "publish",
    label: "Publish",
    title: "Guest Preview",
    description: "Ship when the mobile experience feels perfect.",
  },
];

export function LandingDemoCanvas() {
  const [active, setActive] = useState("structure");

  const activeStep = STEPS.find((step) => step.id === active) ?? STEPS[0];

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="border-b border-border bg-[#FAFAFA] py-28 max-md:text-center md:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <header className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Workflow
            </p>
            <h2
              id="demo-heading"
              className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
            >
              Build once. <span className="air-display-serif">Preview</span> instantly.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              A tactile three-step canvas from draft to live menu — designed to feel as intuitive
              as the dashboard you already know.
            </p>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={120} className="mt-14">
          <div className="air-card air-card-pad mx-auto max-w-4xl">
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActive(step.id)}
                  className={cn(
                    "h-10 rounded-[10px] border px-4 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                    active === step.id
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-border bg-white text-muted-foreground hover:border-slate-300 hover:text-slate-900"
                  )}
                >
                  {step.label}
                </button>
              ))}
            </div>

            <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-border bg-white p-8 md:min-h-[260px] md:p-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.02),_transparent_55%)]" />
              <div className="relative max-md:mx-auto max-md:text-center">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Active module
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  {activeStep.title}
                </h3>
                <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground md:mx-0">
                  {activeStep.description}
                </p>
              </div>

              <div className="relative mt-10 grid gap-3 sm:grid-cols-3">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-all duration-300",
                      active === step.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-border bg-[#FAFAFA] text-slate-700"
                    )}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">
                      {step.label}
                    </p>
                    <p className="mt-2 text-sm font-medium">{step.title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Link href="/menu/santo-sushi" target="_blank" rel="noopener noreferrer">
                <Button variant="light" isExternal>
                  Open Santo Sushi demo
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
