import Link from "next/link";
import { cn } from "@/lib/utils";

type PublicSiteFooterBarProps = {
  className?: string;
  /** Muted text on dark marketing pages vs legal pages */
  tone?: "light" | "dark";
};

export function PublicSiteFooterBar({ className, tone = "dark" }: PublicSiteFooterBarProps) {
  const muted = tone === "light" ? "text-slate-500" : "text-slate-500";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row",
        className
      )}
    >
      <p className={cn("text-center text-xs sm:text-left", muted)}>
        © 2026 Menulia. Todos los derechos reservados.
      </p>
      <p className={cn("text-center text-xs sm:text-right", muted)}>
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
