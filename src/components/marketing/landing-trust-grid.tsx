import { ScrollReveal } from "@/components/marketing/scroll-reveal";

const TESTIMONIALS = [
  {
    venue: "Rue & Bloom Bistro",
    type: "Neighborhood bistro",
    quote:
      "We retired our four-page PDF in an afternoon. Guests finally browse specials on their phones instead of squinting at a laminated sheet.",
    author: "Claire M.",
    role: "Owner",
  },
  {
    venue: "Nonna's Corner Pizzeria",
    type: "Family pizzeria",
    quote:
      "Sunday pricing changes used to mean re-exporting a PDF and texting staff. Now we update once in Menulia and every QR just works.",
    author: "Marco R.",
    role: "General manager",
  },
  {
    venue: "Harbor Lane Café",
    type: "Independent café",
    quote:
      "The live preview sold us — we saw exactly what tourists would see before we printed new table cards. It feels premium without feeling complicated.",
    author: "Elena K.",
    role: "Co-founder",
  },
];

export function LandingTrustGrid() {
  return (
    <section
      id="trust"
      aria-labelledby="trust-heading"
      className="border-b border-border bg-white py-28 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <header className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Trusted locally
            </p>
            <h2
              id="trust-heading"
              className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl"
            >
              Independent restaurants,{" "}
              <span className="air-display-serif">real results</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Neighborhood spots replacing clunky PDFs with menus guests actually want to open.
            </p>
          </header>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <ScrollReveal key={item.venue} delay={index * 80}>
              <figure
                className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 md:p-8"
                style={{ boxShadow: "0 4px 30px rgba(0, 0, 0, 0.01)" }}
              >
                <figcaption className="mb-5">
                  <p className="text-sm font-semibold tracking-tight text-slate-900">
                    {item.venue}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {item.type}
                  </p>
                </figcaption>
                <blockquote className="flex-1 text-base leading-relaxed text-slate-700">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <footer className="mt-6 border-t border-border pt-5">
                  <p className="text-sm font-medium text-slate-900">{item.author}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </footer>
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
