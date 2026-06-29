"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardAuthGuard } from "@/components/dashboard/dashboard-auth-guard";
import { Menu as MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DashboardAuthGuard>
      <div className="air-dashboard flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div className="min-h-screen flex-1 overflow-y-auto bg-background md:pl-64">
          <header className="fixed left-0 right-0 top-0 z-30 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-md md:hidden">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                <MenuIcon className="h-6 w-6" />
              </Button>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Menulia</h1>
            </div>
          </header>

          <main className="p-6 pt-20 md:p-8 md:pt-8">{children}</main>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
