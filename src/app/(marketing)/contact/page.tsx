import { PageHero } from "@/components/marketing/page-hero";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { ContactForm } from "@/components/marketing/contact-form";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import { marketingPageMetadata } from "@/lib/marketing/seo";

export const metadata = marketingPageMetadata({
  title: "Contact",
  description: "Get in touch with the Menulia team. Questions about digital menus, pricing, or onboarding.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        subtitle="Questions about menulia.net? Our team typically responds within 24 hours."
      />
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <ScrollReveal>
              <div className="space-y-6">
                {[
                  { icon: Mail, title: "Email", value: "hello@menulia.net" },
                  { icon: MessageSquare, title: "Live chat", value: "Available for Premium customers" },
                  { icon: MapPin, title: "HQ", value: "Barcelona, Spain" },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition hover:shadow-md"
                  >
                    <item.icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                    <div>
                      <h2 className="text-sm font-medium">{item.title}</h2>
                      <p className="text-muted-foreground">{item.value}</p>
                    </div>
                  </article>
                ))}
              </div>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <ContactForm />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
