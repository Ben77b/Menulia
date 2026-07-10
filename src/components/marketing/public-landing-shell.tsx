import type { ReactNode } from "react";
import { PublicSiteFooterBar, PublicSiteLegalLinks } from "@/components/marketing/public-site-footer-bar";

type PublicLandingShellProps = {
  children: ReactNode;
};

export function PublicLandingShell({ children }: PublicLandingShellProps) {
  return (
    <div className="public-site-grid flex min-h-dvh flex-col bg-white text-slate-900">
      <div className="flex flex-1 items-center justify-center p-6">{children}</div>
      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-lg">
          <PublicSiteLegalLinks />
          <PublicSiteFooterBar className="mt-6" tone="dark" />
        </div>
      </footer>
    </div>
  );
}
