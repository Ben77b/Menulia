import { PageHero } from "@/components/marketing/page-hero";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const metadata = marketingPageMetadata({
  title: "About",
  description:
    "Why mobile PDF menus hurt restaurant sales — and how menulia.net helps owners deliver menus with main character energy.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="Mobile PDFs are killing your sales"
        subtitle="Guests don't pinch-zoom their way to a great meal. They bounce — and your check average goes with them."
      />
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollReveal>
            <article className="space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                Restaurant owners still email PDF menus, upload blurry scans, or link to Google Drive
                folders. On a phone, that experience is slow, illegible, and impossible to navigate
                during a busy service. Guests give up before they fall in love with your food.
              </p>
              <p>
                PDFs also hide your best sellers. Without structure, photography, or dietary filters,
                guests default to the safest item — not your highest-margin plates. That is lost
                revenue on every table, every night.
              </p>
            </article>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <article className="mt-10 rounded-2xl border border-accent/30 bg-accent/5 p-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Menus with main character energy
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                menulia.net replaces the PDF with a mobile-first menu your guests actually enjoy —
                swipeable dishes, instant language switching, and a design studio that makes your
                brand feel intentional, not accidental.
              </p>
            </article>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                { val: "2024", label: "Founded" },
                { val: "28+", label: "Languages" },
                { val: "500+", label: "Restaurants" },
              ].map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-border bg-card p-6 text-center transition hover:shadow-md"
                >
                  <p className="text-3xl font-bold text-accent">{stat.val}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </article>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="mt-12 text-center">
              <Link href="/signup">
                <Button variant="primary">Join us — start free</Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
