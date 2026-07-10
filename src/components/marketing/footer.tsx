import Link from "next/link";
import { PublicSiteFooterBar, PublicSiteLegalLinks } from "@/components/marketing/public-site-footer-bar";

const DEMO_MENU_SLUG = "santo-sushi";

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">Menulia</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Menús digitales premium, multilingües y conformes con la normativa de alérgenos UE.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Producto
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#como-funciona" className="neon-link">
                  Cómo funciona
                </a>
              </li>
              <li>
                <Link href="/signup" className="neon-link">
                  Empezar gratis
                </Link>
              </li>
              <li>
                <Link href="/login" className="neon-link">
                  Iniciar sesión
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Demo en vivo
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link
                  href={`/menu/${DEMO_MENU_SLUG}`}
                  className="neon-link"
                  target="_blank"
                  rel="noopener"
                >
                  Ver menú de ejemplo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <PublicSiteLegalLinks className="[&_.air-link:hover]:text-[#22c55e]" />
          <PublicSiteFooterBar className="mt-6 border-slate-200" tone="dark" />
        </div>
      </div>
    </footer>
  );
}

export { DEMO_MENU_SLUG };
