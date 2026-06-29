import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { AnimatedCounter } from "@/components/marketing/animated-counter";
import {
  ArrowRight,
  Globe,
  Calendar,
  BarChart3,
  Sparkles,
  Smartphone,
  Shield,
  Zap,
  ChevronDown,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-emerald-brand/10 blur-3xl animate-pulse-slow" />
          <div className="absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-coral-cta/10 blur-3xl animate-pulse-slow" />
        </div>
        <div className="relative mx-auto flex min-h-[90vh] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
          <ScrollReveal>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-brand/30 bg-emerald-brand-light/50 px-4 py-1.5 text-sm font-medium text-emerald-brand">
              <Zap className="h-3.5 w-3.5" /> Restaurant SaaS Platform
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Your menu,{" "}
              <span className="bg-gradient-to-r from-emerald-brand to-emerald-brand-dark bg-clip-text text-transparent">
                digitized
              </span>
              <br />
              and{" "}
              <span className="text-coral-cta">unforgettable</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary sm:text-xl">
              Stunning multi-language digital menus, smart reservations, and analytics —
              built for restaurant owners who care about every detail.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button variant="primary" size="lg" className="group transition hover:scale-105">
                  Start free
                  <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/la-calle-tacos">
                <Button variant="outline" size="lg" className="transition hover:scale-105">
                  View live demo
                </Button>
              </Link>
            </div>
          </ScrollReveal>
          <div className="absolute bottom-8 animate-bounce text-text-secondary">
            <ChevronDown className="h-6 w-6" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-surface-elevated py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-6">
          <AnimatedCounter end={28} suffix="+" label="Languages supported" />
          <AnimatedCounter end={500} suffix="+" label="Restaurants served" />
          <AnimatedCounter end={2} suffix="M+" label="Menu views monthly" />
          <AnimatedCounter end={98} suffix="%" label="Owner satisfaction" />
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              Three steps from signup to a live digital menu your guests will love.
            </p>
          </ScrollReveal>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Create your profile", desc: "Add your restaurant name, hours, and branding in minutes." },
              { step: "02", title: "Build your menu", desc: "Add dishes manually or use AI to import from a photo." },
              { step: "03", title: "Share your link", desc: "Guests scan or visit your unique URL — no app download needed." },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 120}>
                <div className="group rounded-2xl border border-border bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl">
                  <span className="text-5xl font-bold text-emerald-brand/20">{item.step}</span>
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-text-secondary">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-t border-border bg-surface-elevated py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Everything your restaurant needs</h2>
          </ScrollReveal>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Globe, title: "28+ languages", desc: "Auto-detect guest language. Reach every tourist." },
              { icon: Smartphone, title: "Mobile-first PWA", desc: "Feels like a native app. Works offline-ready." },
              { icon: Calendar, title: "Smart reservations", desc: "Time slots respect your operating hours." },
              { icon: Sparkles, title: "AI Menu Importer", desc: "Photo in, structured menu out." },
              { icon: BarChart3, title: "Analytics suite", desc: "Traffic, seasonality, expense tracking." },
              { icon: Shield, title: "Secure & reliable", desc: "Enterprise-grade hosting when you go live." },
            ].map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div className="group h-full rounded-2xl border border-border bg-white p-6 transition hover:border-emerald-brand/40 hover:shadow-lg">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-brand-light transition group-hover:scale-110">
                    <f.icon className="h-5 w-5 text-emerald-brand" />
                  </div>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive showcase */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal direction="left">
              <h2 className="text-3xl font-bold sm:text-4xl">
                A menu experience guests actually enjoy
              </h2>
              <p className="mt-4 text-lg text-text-secondary">
                Horizontal dish carousels, dietary filters with icons, burger-menu links,
                and a floating nav — all within a single full-screen view.
              </p>
              <ul className="mt-6 space-y-3">
                {["Swipe through dishes like a story", "Filter vegan, vegetarian, gluten-free", "Book a table without leaving the page"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-brand text-xs text-white">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link href="/sakura-omakase" className="mt-8 inline-block">
                <Button variant="secondary">Try premium demo</Button>
              </Link>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={150}>
              <div className="relative mx-auto max-w-xs">
                <div className="rounded-[2.5rem] border-4 border-zinc-800 bg-zinc-900 p-2 shadow-2xl">
                  <div className="aspect-[9/19] overflow-hidden rounded-[2rem] bg-surface">
                    <iframe
                      src="/sakura-omakase"
                      title="Demo preview"
                      className="h-full w-full border-0"
                    />
                  </div>
                </div>
                <div className="absolute -right-4 -top-4 rounded-xl bg-coral-cta px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                  Live preview
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Demo restaurants */}
      <section className="border-t border-border bg-surface-elevated py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal className="text-center">
            <h2 className="text-3xl font-bold">Explore demo restaurants</h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { slug: "la-calle-tacos", name: "La Calle Tacos", type: "Mexican · Free", emoji: "🌮" },
              { slug: "sakura-omakase", name: "Sakura Omakase", type: "Sushi · Premium", emoji: "🍣" },
              { slug: "nonna-rosa-trattoria", name: "Nonna Rosa", type: "Italian · Free", emoji: "🍝" },
              { slug: "smash-and-co", name: "Smash & Co.", type: "Burgers · Premium", emoji: "🍔" },
            ].map((r, i) => (
              <ScrollReveal key={r.slug} delay={i * 100}>
                <Link
                  href={`/menu/${r.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-1 hover:border-emerald-brand/50 hover:shadow-xl"
                >
                  <span className="text-3xl">{r.emoji}</span>
                  <h3 className="mt-3 font-semibold group-hover:text-emerald-brand">{r.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{r.type}</p>
                  <span className="mt-4 text-sm font-medium text-coral-cta opacity-0 transition group-hover:opacity-100">
                    View menu →
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal className="text-center">
            <h2 className="text-3xl font-bold">Loved by restaurant owners</h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { quote: "Our tourists finally understand the menu. The language switcher is magic.", name: "Marco R.", role: "Trattoria owner, Barcelona" },
              { quote: "Reservations dropped our no-shows by half. Worth every euro of Premium.", name: "Yuki T.", role: "Omakase chef, Madrid" },
              { quote: "Set up in an afternoon. My staff actually uses the dashboard.", name: "Sofia M.", role: "Taco bar, Valencia" },
            ].map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 100}>
                <blockquote className="h-full rounded-2xl border border-border bg-white p-6 transition hover:shadow-md">
                  <p className="text-text-secondary">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="mt-4">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-text-secondary">{t.role}</p>
                  </footer>
                </blockquote>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-surface-elevated py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollReveal className="text-center">
            <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          </ScrollReveal>
          <div className="mt-10 space-y-4">
            {[
              { q: "Do my guests need to download an app?", a: "No. Your menu is a web page that works on any phone browser." },
              { q: "Can I preview before going live?", a: "Yes. Your dashboard includes a full guest preview in the same tab." },
              { q: "How many languages are supported?", a: "28 languages with automatic browser detection." },
              { q: "Is there a free plan?", a: "Yes. Digital menus are free forever. Premium adds reservations, AI import, and analytics." },
            ].map((faq, i) => (
              <ScrollReveal key={faq.q} delay={i * 60}>
                <details className="group rounded-2xl border border-border bg-white p-5 transition open:shadow-md">
                  <summary className="cursor-pointer font-semibold marker:content-none group-open:text-emerald-brand">
                    {faq.q}
                  </summary>
                  <p className="mt-3 text-sm text-text-secondary">{faq.a}</p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-emerald-brand py-24 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <ScrollReveal className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to modernize your restaurant?</h2>
          <p className="mt-4 text-lg opacity-90">
            Join hundreds of restaurants already using menulia.io.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-coral-cta hover:bg-coral-cta-dark">
                Start free today
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                View pricing
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
