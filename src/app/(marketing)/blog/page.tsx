import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

export const metadata = {
  title: "Blog",
  description: "Insights, guides, and tips for modern restaurant owners from the menulia.io team.",
};

const POSTS = [
  { slug: "why-digital-menus-matter", title: "Why Digital Menus Matter in 2026", excerpt: "Paper menus are costing you guests. Here's how interactive displays drive engagement.", date: "May 28, 2026", tag: "Growth" },
  { slug: "multi-language-restaurants", title: "Serving Tourists: A Multi-Language Guide", excerpt: "How to configure 28-language menus that auto-detect your guest's preferred language.", date: "May 15, 2026", tag: "Product" },
  { slug: "reservation-best-practices", title: "Reservation Best Practices for Small Restaurants", excerpt: "Reduce no-shows and fill tables with smart booking workflows.", date: "Apr 30, 2026", tag: "Operations" },
  { slug: "design-your-menu-page", title: "Design a Menu Page Guests Actually Use", excerpt: "Carousels, dietary icons, and full-screen layouts that convert browsers into diners.", date: "Apr 12, 2026", tag: "Design" },
];

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Insights for modern restaurant owners"
        subtitle="Guides, product updates, and hospitality tips from the menulia.io team."
      />
      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="space-y-6">
            {POSTS.map((post, i) => (
              <ScrollReveal key={post.slug} delay={i * 80}>
                <article className="group rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emerald-brand-light px-2.5 py-0.5 text-xs font-medium text-emerald-brand">
                      {post.tag}
                    </span>
                    <p className="text-xs text-text-secondary">{post.date}</p>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold group-hover:text-emerald-brand">{post.title}</h2>
                  <p className="mt-2 text-sm text-text-secondary">{post.excerpt}</p>
                  <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-medium text-coral-cta hover:underline">
                    Read more →
                  </Link>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
