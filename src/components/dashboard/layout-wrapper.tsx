"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardAuthGuard } from "@/components/dashboard/dashboard-auth-guard";
import { DashboardLocaleProvider } from "@/contexts/dashboard-locale-context";
import { ToastProvider } from "@/components/ui/toast";
import { Menu as MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLocaleToggle } from "@/components/dashboard/dashboard-locale-toggle";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DashboardAuthGuard>
      <DashboardLocaleProvider>
        <ToastProvider>
        <div className="air-dashboard flex min-h-screen bg-neutral-50/80">
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

          <div className="min-h-screen flex-1 overflow-y-auto bg-neutral-50/80 md:pl-64">
            <header className="fixed left-0 right-0 top-0 z-30 border-b border-neutral-200/50 bg-white/80 px-4 py-3 backdrop-blur-md md:hidden">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                  <MenuIcon className="h-6 w-6" />
                </Button>
              <div className="flex items-center gap-2">
                <DashboardLocaleToggle />
                <h1 className="text-lg font-bold tracking-tight text-slate-900">Menulia</h1>
              </div>
              </div>
            </header>

            <main className="mx-auto max-w-6xl p-5 pt-20 md:px-8 md:py-10 md:pt-10 lg:px-10">{children}</main>
          </div>
        </div>
        </ToastProvider>
      </DashboardLocaleProvider>
    </DashboardAuthGuard>
  );
}
