"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  BarChart3,
  ScanLine,
  Settings,
  Crown,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, premium: false },
  { href: "/dashboard/preview", label: "Guest Preview", icon: Eye, premium: false },
  { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed, premium: false },
  { href: "/dashboard/importer", label: "AI Menu Importer", icon: ScanLine, premium: true },
  { href: "/dashboard/reservations", label: "Reservations", icon: CalendarDays, premium: true },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, premium: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, premium: false },
];

interface DashboardSidebarProps {
  isPremium: boolean;
  restaurantName: string;
}

export function DashboardSidebar({ isPremium, restaurantName }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface-elevated">
      <div className="border-b border-border p-5">
        <Link href="/" className="text-sm font-semibold text-emerald-brand">
          menulia.io
        </Link>
        <p className="mt-1 truncate text-sm font-medium">{restaurantName}</p>
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

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-emerald-brand-light font-medium text-emerald-brand"
                  : "text-text-secondary hover:bg-muted hover:text-text-primary"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.premium && !isPremium && (
                <Crown className="h-3.5 w-3.5 text-coral-cta" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
