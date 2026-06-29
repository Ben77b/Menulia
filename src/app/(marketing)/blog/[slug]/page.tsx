import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/marketing/page-hero";
import { JsonLd } from "@/components/marketing/json-ld";
import { BLOG_POSTS, getAllBlogSlugs, getBlogPost } from "@/lib/marketing/blog-posts";
import { articleJsonLd, marketingPageMetadata } from "@/lib/marketing/seo";

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return { title: "Post not found" };
  }

  return marketingPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <JsonLd data={articleJsonLd(post)} />
      <PageHero eyebrow={post.tag} title={post.title} subtitle={post.excerpt} />
      <article className="pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <header className="mb-10 flex flex-wrap items-center gap-3 border-b border-border pb-6 text-sm text-muted-foreground">
            <time dateTime={post.date}>{post.dateLabel}</time>
            <span aria-hidden>·</span>
            <span>{post.readTime}</span>
            <span aria-hidden>·</span>
            <span>{post.author}</span>
          </header>

          <div className="space-y-8">
            {post.sections.map((section, index) => (
              <section key={index}>
                {section.heading && (
                  <h2 className="mb-3 text-xl font-semibold tracking-tight text-slate-900">
                    {section.heading}
                  </h2>
                )}
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-4 leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <footer className="mt-12 border-t border-border pt-8">
            <Link href="/blog" className="text-sm font-medium text-accent hover:underline">
              ← Back to all articles
            </Link>
          </footer>
        </div>
      </article>
    </>
  );
}
