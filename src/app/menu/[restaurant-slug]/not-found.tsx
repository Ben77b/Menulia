import Link from "next/link";
import { cookies } from "next/headers";
import { UtensilsCrossed } from "lucide-react";
import { DEFAULT_PUBLIC_MENU_SPLASH } from "@/lib/public-menu-cache";
import { isDashboardLocale } from "@/lib/dashboard-i18n";

const COPY = {
  en: {
    title: "Oops! This menu isn't cooking anything yet.",
    body: "The link may be wrong, or this restaurant hasn't published their menu yet.",
    cta: "Back to Menulia",
  },
  es: {
    title: "¡Ups! Este menú no está cocinando nada todavía.",
    body: "El enlace puede ser incorrecto, o este restaurante aún no ha publicado su menú.",
    cta: "Volver a Menulia",
  },
} as const;

export default async function PublicMenuNotFound() {
  const splash = DEFAULT_PUBLIC_MENU_SPLASH;
  const cookieStore = await cookies();
  const stored = cookieStore.get("menulia_locale")?.value;
  const locale = isDashboardLocale(stored) ? stored : "en";
  const copy = COPY[locale];

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ backgroundColor: splash.backgroundColor }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-3xl border border-black/5 bg-white/70 shadow-sm backdrop-blur-sm"
          style={{ color: splash.accentColor }}
        >
          <UtensilsCrossed className="h-10 w-10" strokeWidth={1.5} aria-hidden />
        </div>

        <div className="space-y-3">
          <h1 className="text-xl font-semibold text-slate-900">{copy.title}</h1>
          <p className="text-sm text-[#86868B]">{copy.body}</p>
        </div>

        <Link
          href="https://www.menulia.net"
          className="inline-flex min-h-11 items-center rounded-full border border-[#E5E5EA] bg-white px-6 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          {copy.cta}
        </Link>
      </div>
    </div>
  );
}
