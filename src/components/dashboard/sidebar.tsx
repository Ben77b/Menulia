"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  Home,
  LayoutTemplate,
  Palette,
  User,
  ChevronDown,
  Building2,
  X,
  Share2,
  Check,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRestaurant } from "@/contexts/restaurant-context";
import { AddRestaurantModal } from "@/components/dashboard/add-restaurant-modal";
import { publicMenuAbsoluteUrl } from "@/lib/public-menu-url";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const restaurantId = params.restaurantId as string | undefined;
  const [restaurantOpen, setRestaurantOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const {
    currentRestaurant,
    restaurants,
    switchRestaurant,
    loading,
    isFetching,
    bootstrapped,
    user,
    userProfile,
  } = useRestaurant();

  const profileName =
    user?.user_metadata?.full_name || userProfile?.displayName || user?.email?.split("@")[0] || "Account";
  const profileSubtitle = user?.email ?? "Account settings";
  const isAccountPage = pathname === "/dashboard/account";

  const activeRestaurant =
    currentRestaurant ??
    (restaurantId ? restaurants.find((entry) => entry.id === restaurantId) : null) ??
    restaurants[0] ??
    null;

  const hasRestaurants = restaurants.length > 0;
  const workspaceReady = bootstrapped && !loading && !isFetching;
  const showOnboardingLockout = workspaceReady && !hasRestaurants;

  const activeRestaurantId = hasRestaurants
    ? currentRestaurant?.id ?? restaurantId ?? restaurants[0]?.id
    : undefined;

  const navItems =
    user && hasRestaurants && activeRestaurantId
      ? [
          { icon: Home, label: "Home", href: `/dashboard/${activeRestaurantId}` },
          { icon: LayoutTemplate, label: "Menu Builder", href: `/dashboard/${activeRestaurantId}/menu` },
          { icon: Share2, label: "Share the Menu", href: `/dashboard/${activeRestaurantId}/qr` },
          { icon: Settings, label: "Settings", href: `/dashboard/${activeRestaurantId}/settings` },
          {
            icon: Palette,
            label: "Design Studio",
            href: `/dashboard/${activeRestaurantId}/branding`,
          },
        ]
      : [];

  const handleRestaurantSwitch = (id: string) => {
    setRestaurantOpen(false);
    switchRestaurant(id);

    if (restaurantId && pathname.startsWith(`/dashboard/${restaurantId}`)) {
      const suffix = pathname.replace(`/dashboard/${restaurantId}`, "");
      router.push(`/dashboard/${id}${suffix}`);
      return;
    }

    router.push(`/dashboard/${id}`);
  };

  const handleAddRestaurant = () => {
    setRestaurantOpen(false);
    setAddModalOpen(true);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden" onClick={onToggle} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-[#E5E5EA] bg-white transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0 w-72" : "-translate-x-full w-72",
          "md:translate-x-0 md:w-64"
        )}
      >
        <div className="flex h-full flex-col px-4 py-6">
          <div className="mb-8 px-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Menulia</h1>
            <p className="mt-0.5 text-xs text-[#86868B]">Restaurant workspace</p>
          </div>

          {!workspaceReady && user ? (
            <div className="mb-6 rounded-2xl border border-[#E5E5EA] bg-[#FAFAFA] px-4 py-4 text-sm text-[#86868B]">
              Loading workspace…
            </div>
          ) : hasRestaurants ? (
            <div className="mb-6 px-1">
              <div className="relative">
                <button
                  onClick={() => setRestaurantOpen(!restaurantOpen)}
                  className="air-card flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA]"
                >
                  {activeRestaurant?.logo ? (
                    <img
                      src={activeRestaurant.logo}
                      alt=""
                      className="h-9 w-9 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F7]">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {activeRestaurant?.name || "Select Restaurant"}
                    </p>
                    <p className="text-xs text-[#86868B]">
                      {loading
                        ? "Loading..."
                        : `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-[#86868B] transition-transform",
                      restaurantOpen && "rotate-180"
                    )}
                  />
                </button>

                {restaurantOpen && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[#E5E5EA] bg-white p-2 shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
                    {restaurants.map((restaurant) => {
                      const isActive = restaurant.id === activeRestaurantId;
                      return (
                        <button
                          key={restaurant.id}
                          onClick={() => handleRestaurantSwitch(restaurant.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                            isActive
                              ? "bg-[#F5F5F7] font-medium text-slate-900"
                              : "text-slate-600 hover:bg-[#FAFAFA]"
                          )}
                        >
                          {restaurant.logo ? (
                            <img
                              src={restaurant.logo}
                              alt=""
                              className="h-6 w-6 rounded-lg object-cover"
                            />
                          ) : (
                            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <span className="flex-1 truncate text-left">{restaurant.name}</span>
                          {isActive && <Check className="h-4 w-4 shrink-0 text-slate-600" />}
                        </button>
                      );
                    })}
                    <button
                      onClick={handleAddRestaurant}
                      className="mt-1 w-full rounded-xl border-t border-[#F5F5F7] px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#FAFAFA]"
                    >
                      ＋ Add New Restaurant
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : showOnboardingLockout ? (
            <div className="mb-6 rounded-2xl border border-dashed border-[#E5E5EA] bg-[#FAFAFA] px-4 py-4 text-sm text-[#86868B]">
              Dashboard locked until your first restaurant is created.
            </div>
          ) : null}

          <nav className="flex-1 space-y-1 px-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onToggle}
                  className={cn("air-sidebar-link", isActive && "air-sidebar-link-active")}
                >
                  <item.icon className="h-5 w-5 shrink-0 text-slate-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {activeRestaurant?.slug && (
              <Button
                variant="light"
                href={publicMenuAbsoluteUrl(activeRestaurant.slug)}
                target="_blank"
                rel="noopener noreferrer"
                isExternal
                className="mt-3 w-full justify-start"
              >
                View Live Menu
              </Button>
            )}
          </nav>

          <div className="mt-6 px-1 pt-2">
            <Link
              href="/dashboard/account"
              onClick={onToggle}
              className={cn("air-profile-card", isAccountPage && "air-profile-card-active")}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F5F7]">
                <User className="h-4 w-4 text-slate-600" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-slate-900">{profileName}</p>
                <p className="truncate text-xs text-[#86868B]">{profileSubtitle}</p>
              </div>
              <ChevronDown className="-rotate-90 h-4 w-4 shrink-0 text-[#86868B]" />
            </Link>
          </div>

          <button
            onClick={onToggle}
            className="absolute right-4 top-5 rounded-xl p-2 transition-colors hover:bg-[#F5F5F7] md:hidden"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
      </aside>

      {hasRestaurants && (
        <AddRestaurantModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      )}
    </>
  );
}
