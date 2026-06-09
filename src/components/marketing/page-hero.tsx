import { ScrollReveal } from "./scroll-reveal";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export function PageHero({ eyebrow, title, subtitle, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-brand-light/60 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <ScrollReveal>
          {eyebrow && (
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-emerald-brand">
              {eyebrow}
            </p>
          )}
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-text-secondary">{subtitle}</p>
          {children && <div className="mt-8">{children}</div>}
        </ScrollReveal>
      </div>
    </section>
  );
}
