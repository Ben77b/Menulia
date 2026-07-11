import Link from "next/link";
import { cn } from "@/lib/utils";
import { FooterLocaleToggle } from "@/components/marketing/footer-locale-toggle";
import type { MarketingLocale } from "@/lib/marketing/locale";

type PublicSiteFooterBarProps = {
  className?: string;
  tone?: "light" | "dark";
  locale?: MarketingLocale;
};

export function PublicSiteFooterBar({
  className,
  tone = "dark",
  locale,
}: PublicSiteFooterBarProps) {
  const muted = tone === "light" ? "text-slate-500" : "text-slate-500";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between",
        className
      )}
    >
      <p className={cn("text-center text-xs sm:text-left", muted)}>
        © 2026 Menulia. Todos los derechos reservados.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-end">
        <FooterLocaleToggle locale={locale} />
        <p className={cn("text-center text-xs", muted)}>
          Desarrollado por{" "}
          <a
            href="https://benjy.es"
            target="_blank"
            rel="noopener"
            className="font-medium transition-colors hover:text-[#22c55e]"
          >
            Benjy.es
          </a>
        </p>
      </div>
    </div>
  );
}

export function PublicSiteLegalLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-8 gap-y-3", className)}>
      <Link href="/legal" className="air-link hover:text-[#22c55e]">
        Aviso Legal
      </Link>
      <Link href="/privacy" className="air-link hover:text-[#22c55e]">
        Política de Privacidad
      </Link>
      <Link href="/terms" className="air-link hover:text-[#22c55e]">
        Términos del Servicio
      </Link>
    </div>
  );
}
