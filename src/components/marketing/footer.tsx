import Link from "next/link";
import { PublicSiteFooterBar, PublicSiteLegalLinks } from "@/components/marketing/public-site-footer-bar";

const DEMO_MENU_SLUG = "santo-sushi";

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">Menulia</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Menús digitales premium, multilingües y conformes con la normativa de alérgenos UE.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              Producto
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#como-funciona" className="transition-colors hover:text-white">
                  Cómo funciona
                </a>
              </li>
              <li>
                <Link href="/signup" className="transition-colors hover:text-white">
                  Empezar gratis
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-white">
                  Iniciar sesión
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              Demo en vivo
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link
                  href={`/menu/${DEMO_MENU_SLUG}`}
                  className="transition-colors hover:text-white"
                  target="_blank"
                  rel="noopener"
                >
                  Ver menú de ejemplo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-8">
          <PublicSiteLegalLinks className="[&_.air-link]:text-slate-400 [&_.air-link:hover]:text-white" />
          <PublicSiteFooterBar className="mt-6 border-slate-800" tone="light" />
        </div>
      </div>
    </footer>
  );
}

export { DEMO_MENU_SLUG };
