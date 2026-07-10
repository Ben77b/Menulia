import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { DEFAULT_PUBLIC_MENU_SPLASH } from "@/lib/public-menu-cache";

export default function PublicMenuNotFound() {
  const splash = DEFAULT_PUBLIC_MENU_SPLASH;

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
          <h1 className="text-xl font-semibold text-slate-900">
            ¡Ups! Este menú no está cocinando nada todavía
          </h1>
          <p className="text-base text-slate-600">
            Oops! This menu isn&apos;t cooking anything yet.
          </p>
          <p className="text-sm text-[#86868B]">
            The link may be wrong, or this restaurant hasn&apos;t published their menu yet.
          </p>
        </div>

        <Link
          href="https://www.menulia.net"
          className="rounded-full border border-[#E5E5EA] bg-white px-6 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          Volver a Menulia / Back to Menulia
        </Link>
      </div>
    </div>
  );
}
