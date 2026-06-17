"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Utensils,
  Palette,
  Calendar,
  QrCode,
  Settings,
  Crown,
  X,
  ChevronDown,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home, premium: false },
  { href: "/dashboard/menu", label: "Menu Builder", icon: Utensils, premium: false },
  { href: "/dashboard/design", label: "Branding & Design", icon: Palette, premium: false },
  { href: "/dashboard/reservations", label: "Reservations", icon: Calendar, premium: true },
  { href: "/dashboard/share", label: "QR Code Access", icon: QrCode, premium: false },
  { href: "/dashboard/settings", label: "Business Settings", icon: Settings, premium: false },
];

interface DashboardSidebarProps {
  isPremium: boolean;
  restaurantName: string;
  restaurantSlug: string;
  isOpen: boolean;
  onToggle: () => void;
  restaurants?: { id: string; name: string; slug: string }[];
  currentRestaurantId?: string;
  onRestaurantChange?: (id: string) => void;
}

export function DashboardSidebar({ 
  isPremium, 
  restaurantName,
  restaurantSlug,
  isOpen, 
  onToggle,
  restaurants = [],
  currentRestaurantId,
  onRestaurantChange 
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [restaurantDropdownOpen, setRestaurantDropdownOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface-elevated transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4 lg:p-5">
          <Link href="/" className="text-sm font-semibold text-emerald-brand">
            menulia.io
          </Link>
          <button
            onClick={onToggle}
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Restaurant switcher */}
        <div className="border-b border-border p-4 pb-3 lg:p-5 lg:pb-4">
          <div className="relative">
            <button
              onClick={() => setRestaurantDropdownOpen(!restaurantDropdownOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-left hover:bg-muted/80"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Store className="h-4 w-4 shrink-0 text-emerald-brand" />
                <span className="truncate text-sm font-medium">{restaurantName}</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary" />
            </button>
            
            {restaurantDropdownOpen && restaurants.length > 1 && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRestaurantDropdownOpen(false)} />
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-white p-1 shadow-xl">
                  {restaurants.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onRestaurantChange?.(r.id);
                        setRestaurantDropdownOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
                        r.id === currentRestaurantId && "bg-muted font-medium"
                      )}
                    >
                      <Store className="h-4 w-4 shrink-0 text-emerald-brand" />
                      <span className="truncate">{r.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {isPremium ? (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-brand-light px-2 py-0.5 text-xs font-medium text-emerald-brand">
              <Crown className="h-3 w-3" /> Premium
            </span>
          ) : (
            <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-text-secondary">
              Free plan
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 lg:p-4">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.premium && !isPremium && (
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
