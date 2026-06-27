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
      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div className="min-h-screen flex-1 overflow-y-auto bg-gray-50/50 md:pl-64">
          <header className="fixed left-0 right-0 top-0 z-30 border-b border-gray-100 bg-white px-4 py-3 md:hidden">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                <MenuIcon className="h-6 w-6" />
              </Button>
              <h1 className="text-lg font-bold text-gray-900">Menulia</h1>
            </div>
          </header>

          <main className="p-6 pt-20 md:pt-6">{children}</main>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
