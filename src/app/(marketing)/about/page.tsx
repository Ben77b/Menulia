import { PageHero } from "@/components/marketing/page-hero";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About",
  description: "Learn about menulia.io — the premium digital menu and reservation platform built for modern restaurants.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="Built for hospitality, by people who love food"
        subtitle="We believe every restaurant deserves a beautiful digital presence — without the complexity of traditional software."
      />
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollReveal>
            <p className="text-lg leading-relaxed text-text-secondary">
              menulia.io was born from a simple frustration: restaurant owners spending hours
              updating PDF menus, missing reservations buried in phone calls, and having zero
              visibility into what guests actually want.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mt-6 leading-relaxed text-text-secondary">
              We combined a mobile-first diner experience with a dead-simple admin dashboard,
              so you can focus on what matters — exceptional food and memorable service.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                { val: "2024", label: "Founded" },
                { val: "28+", label: "Languages" },
                { val: "500+", label: "Restaurants" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-white p-6 text-center transition hover:shadow-md">
                  <p className="text-3xl font-bold text-emerald-brand">{s.val}</p>
                  <p className="mt-1 text-sm text-text-secondary">{s.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="mt-12 text-center">
              <Link href="/onboarding">
                <Button size="lg">Join us — start free</Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
