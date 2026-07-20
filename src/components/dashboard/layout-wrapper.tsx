"use client";

import { useState } from "react";
import { ArrowUpRight, Menu as MenuIcon } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardAuthGuard } from "@/components/dashboard/dashboard-auth-guard";
import { DashboardLocaleProvider } from "@/contexts/dashboard-locale-context";
import { ToastProvider } from "@/components/ui/toast";
import { DashboardFlashToast } from "@/components/dashboard/dashboard-flash-toast";
import { Button } from "@/components/ui/button";
import { DashboardLocaleToggle } from "@/components/dashboard/dashboard-locale-toggle";
import { useActiveRestaurant } from "@/hooks/use-active-restaurant";
import { getPublicMenuUrl } from "@/lib/site-url";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

function DashboardTopHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { activeRestaurant } = useActiveRestaurant();
  const menuUrl = activeRestaurant?.slug
    ? getPublicMenuUrl(activeRestaurant.slug)
    : null;

  return (
    <header className="fixed left-0 right-0 top-0 z-20 h-14 border-b border-neutral-200/60 bg-white/80 backdrop-blur-md md:left-64">
      <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onOpenSidebar}
            aria-label="Open navigation"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <span className="truncate text-lg font-semibold tracking-tight text-neutral-950">
            menulia
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <DashboardLocaleToggle className="md:hidden" />
          {menuUrl ? (
            <a
              href={menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
            >
              view menu
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DashboardAuthGuard>
      <DashboardLocaleProvider>
        <ToastProvider>
          <DashboardFlashToast />
          <div className="air-dashboard flex min-h-screen bg-neutral-50/80">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <div className="min-h-screen flex-1 overflow-y-auto bg-neutral-50/80 md:pl-64">
              <DashboardTopHeader onOpenSidebar={() => setSidebarOpen(true)} />

              <main className="mx-auto max-w-6xl px-5 pb-5 pt-20 md:px-8 md:pb-10 md:pt-24 lg:px-10">
                {children}
              </main>
            </div>
          </div>
        </ToastProvider>
      </DashboardLocaleProvider>
    </DashboardAuthGuard>
  );
}
