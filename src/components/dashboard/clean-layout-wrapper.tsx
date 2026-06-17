"use client";

import { useState } from "react";
import { CleanSidebar } from "@/components/dashboard/clean-sidebar";
import { Menu as MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CleanLayoutWrapperProps {
  children: React.ReactNode;
}

export function CleanLayoutWrapper({ children }: CleanLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <CleanSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 min-h-screen bg-gray-50/50 overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">menulia.io</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
