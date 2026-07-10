import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/marketing/json-ld";
import { DEMO_MENU_SLUG } from "@/components/marketing/footer";
import { marketingPageMetadata } from "@/lib/marketing/seo";
import {
  ArrowRight,
  Languages,
  QrCode,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

export const metadata = marketingPageMetadata({
  title: "Menulia — Menú digital premium para restaurantes",
  description:
    "Crea un menú interactivo, elegante y adaptado a la normativa de alérgenos en menos de 5 minutos. Multilingüe, con QR y diseño profesional.",
  path: "/",
});

const STEPS = [
  {
    icon: UtensilsCrossed,
    title: "Sube tus platos",
    description: "Control total de precios, categorías y variaciones.",
  },
  {
    icon: Languages,
    title: "Traduce al instante",
    description: "Cambia entre idiomas con un solo clic con nuestro motor optimizado.",
  },
  {
    icon: QrCode,
    title: "Descarga tu QR",
    description: "Imprime y comparte tu menú al instante con tus comensales.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Menulia — Menú digital premium",
          description:
            "Menú digital interactivo, multilingüe y conforme con la normativa de alérgenos UE.",
          url: "https://menulia.net",
        }}
      />

      {/* Hero */}
      <section
        id="top"
        aria-labelledby="hero-heading"
        className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-6 md:pb-32 md:pt-36"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.22),transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-6 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-indigo-200">
            Menús digitales · Multilingüe · Normativa UE
          </p>

          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.08]"
          >
            El menú digital que tu restaurante merece.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg md:mt-8">
            Crea un menú interactivo, elegante y adaptado a la normativa de alérgenos en menos de
            5 minutos. Sin complicaciones.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="min-w-[180px] bg-white text-slate-900 hover:bg-slate-100"
              >
                Empezar gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/menu/${DEMO_MENU_SLUG}`} target="_blank" rel="noopener">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[180px] border-slate-600 bg-transparent text-white hover:border-slate-500 hover:bg-white/5"
              >
                Ver ejemplo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3-step flow */}
      <section
        id="como-funciona"
        aria-labelledby="steps-heading"
        className="border-t border-slate-800/80 px-4 py-20 sm:px-6 md:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-400">
              Cómo funciona
            </p>
            <h2
              id="steps-heading"
              className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Tres pasos. Menú listo.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
              Diseñado para dueños de restaurante que quieren lanzar rápido sin sacrificar calidad.
            </p>
          </header>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <article
                key={step.title}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-indigo-500/40 hover:bg-slate-900/80 hover:shadow-[0_0_40px_rgba(99,102,241,0.08)]"
              >
                <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20 transition-colors group-hover:bg-indigo-500/25">
                  <step.icon className="h-6 w-6" aria-hidden />
                </span>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Paso {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance banner */}
      <section aria-labelledby="compliance-heading" className="px-4 pb-24 sm:px-6 md:pb-32">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-8 text-center sm:flex-row sm:gap-6 sm:px-10 sm:text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
              <ShieldCheck className="h-7 w-7" aria-hidden />
            </span>
            <div>
              <h2 id="compliance-heading" className="text-lg font-semibold text-white">
                100% conforme con la normativa española y los 14 alérgenos UE
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Menulia incluye el motor de alérgenos según el Reglamento UE 1169/2011, para que tu
                menú cumpla con la legislación alimentaria española y europea desde el primer día.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="min-w-[200px] bg-indigo-500 text-white hover:bg-indigo-400"
              >
                Crear mi menú ahora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
