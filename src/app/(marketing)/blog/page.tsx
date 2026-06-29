import Link from "next/link";
import { PageHero } from "@/components/marketing/page-hero";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { BLOG_POSTS } from "@/lib/marketing/blog-posts";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const metadata = marketingPageMetadata({
  title: "Blog",
  description: "Insights, guides, and tips for modern restaurant owners from the menulia.net team.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Insights for modern restaurant owners"
        subtitle="Guides, product updates, and hospitality tips from the menulia.net team."
      />
      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="space-y-6">
            {BLOG_POSTS.map((post, i) => (
              <ScrollReveal key={post.slug} delay={i * 80}>
                <article className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <header className="flex items-center gap-3">
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                      {post.tag}
                    </span>
                    <time className="text-xs text-muted-foreground" dateTime={post.date}>
                      {post.dateLabel}
                    </time>
                  </header>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight group-hover:text-slate-900">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
                  >
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
