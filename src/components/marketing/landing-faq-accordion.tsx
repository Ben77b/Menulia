"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { LANDING_FAQ_ITEMS } from "@/lib/marketing/faq";
import { cn } from "@/lib/utils";

export function LandingFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-b border-border bg-[#FAFAFA] py-28 md:py-32"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <ScrollReveal>
          <header className="mb-12 text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              FAQ
            </p>
            <h2
              id="faq-heading"
              className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
            >
              Questions, <span className="air-display-serif">answered</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Everything independent restaurant owners ask before ditching the PDF for good.
            </p>
          </header>
        </ScrollReveal>

        <ScrollReveal>
          <dl className="divide-y divide-border rounded-2xl border border-border bg-white">
            {LANDING_FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={item.question}>
                  <dt>
                    <button
                      type="button"
                      id={`faq-question-${index}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[#FAFAFA] active:scale-[0.995] md:px-8 md:py-6"
                    >
                      <span className="text-base font-medium tracking-tight text-slate-900 md:text-lg">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-180"
                        )}
                        aria-hidden
                      />
                    </button>
                  </dt>
                  <dd
                    id={`faq-answer-${index}`}
                    aria-labelledby={`faq-question-${index}`}
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <p className="px-6 pb-5 text-base leading-relaxed text-muted-foreground md:px-8 md:pb-6">
                      {item.answer}
                    </p>
                  </dd>
                </div>
              );
            })}
          </dl>
        </ScrollReveal>
      </div>
    </section>
  );
}
