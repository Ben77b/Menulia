"use client";

import { PageHero } from "@/components/marketing/page-hero";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        subtitle="Questions about menulia.io? Our team typically responds within 24 hours."
      />
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <ScrollReveal>
              <div className="space-y-6">
                {[
                  { icon: Mail, title: "Email", value: "hello@menulia.io" },
                  { icon: MessageSquare, title: "Live chat", value: "Available for Premium customers" },
                  { icon: MapPin, title: "HQ", value: "Barcelona, Spain" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 rounded-2xl border border-border bg-white p-5 transition hover:shadow-md">
                    <item.icon className="h-5 w-5 shrink-0 text-emerald-brand" />
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-text-secondary">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <form
                className="rounded-2xl border border-border bg-white p-8 shadow-sm"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="space-y-4">
                  <input placeholder="Your name" className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none transition focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/20" />
                  <input type="email" placeholder="Email" className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none transition focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/20" />
                  <textarea placeholder="How can we help?" rows={5} className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none transition focus:border-emerald-brand focus:ring-2 focus:ring-emerald-brand/20" />
                </div>
                <Button variant="primary" className="mt-6 w-full" size="lg">Send message</Button>
              </form>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
