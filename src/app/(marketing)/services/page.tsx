import { PageHero } from "@/components/marketing/page-hero";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { Globe, Calendar, ScanLine, BarChart3, Eye, Palette } from "lucide-react";

export const metadata = {
  title: "Services",
  description: "Digital menus, reservations, AI menu import, analytics, and guest preview — everything your restaurant needs.",
};

const SERVICES = [
  { icon: Globe, title: "Digital Menu Platform", description: "Interactive, mobile-first menus with 28+ languages, dietary filters, and horizontal dish carousels." },
  { icon: Calendar, title: "Reservation Management", description: "Let diners book tables directly. Smart time slots respect your operating hours." },
  { icon: ScanLine, title: "AI Menu Importer", description: "Upload a photo of your paper menu. AI extracts items into a reviewable staging table." },
  { icon: BarChart3, title: "Analytics & Insights", description: "Track page views, reservation conversions, seasonal patterns, and expenses." },
  { icon: Eye, title: "Guest Preview", description: "See exactly how diners view your restaurant — from inside your dashboard, same tab." },
  { icon: Palette, title: "Design Customization", description: "Customize accent colors, backgrounds, card styles, and burger menu links." },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Everything you need to run a modern restaurant"
        subtitle="From menu to metrics — one platform, zero complexity."
      />
      <section className="pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="space-y-6">
            {SERVICES.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 80}>
                <div className="group flex gap-5 rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-brand/30 hover:shadow-lg">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-brand-light transition group-hover:scale-110">
                    <s.icon className="h-6 w-6 text-emerald-brand" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{s.title}</h2>
                    <p className="mt-2 text-text-secondary">{s.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
