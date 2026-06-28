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
  QrCode,
  ExternalLink,
  Check,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRestaurant } from "@/contexts/restaurant-context";
import { AddRestaurantModal } from "@/components/dashboard/add-restaurant-modal";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const {
    currentRestaurant,
    restaurants,
    hasRestaurants,
    switchRestaurant,
    loading,
    user,
  } = useRestaurant();

  const activeRestaurantId = hasRestaurants
    ? currentRestaurant?.id ?? restaurants[0]?.id
    : undefined;

  const navItems =
    user && hasRestaurants && activeRestaurantId
      ? [
          { icon: Home, label: "Home", href: `/dashboard/${activeRestaurantId}` },
          { icon: LayoutTemplate, label: "Menu Builder", href: `/dashboard/${activeRestaurantId}/menu` },
          { icon: QrCode, label: "QR Code", href: `/dashboard/${activeRestaurantId}/qr` },
          { icon: Settings, label: "Settings", href: `/dashboard/${activeRestaurantId}/settings` },
          {
            icon: Palette,
            label: "Design & Display",
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
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onToggle} />
      )}

      <aside
        className={`
          fixed md:fixed top-0 left-0 z-50 h-full
          bg-white border-r border-gray-100
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:w-64
          ${isOpen ? "w-72" : ""}
        `}
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">Menulia</h1>
          </div>

          {hasRestaurants ? (
            <div className="mb-6 border-b border-gray-100 pb-6">
              <div className="relative">
                <button
                  onClick={() => setRestaurantOpen(!restaurantOpen)}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  {currentRestaurant?.logo ? (
                    <img
                      src={currentRestaurant.logo}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-gray-600" />
                  )}
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {currentRestaurant?.name || "Select Restaurant"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {loading
                        ? "Loading..."
                        : `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${restaurantOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {restaurantOpen && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
                    {restaurants.map((restaurant) => {
                      const isActive = restaurant.id === activeRestaurantId;
                      return (
                        <button
                          key={restaurant.id}
                          onClick={() => handleRestaurantSwitch(restaurant.id)}
                          className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors ${
                            isActive
                              ? "bg-indigo-50 text-indigo-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {restaurant.logo ? (
                            <img
                              src={restaurant.logo}
                              alt=""
                              className="h-6 w-6 rounded object-cover"
                            />
                          ) : (
                            <Building2 className="h-4 w-4 shrink-0" />
                          )}
                          <span className="flex-1 truncate text-left">{restaurant.name}</span>
                          {isActive && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })}
                    <button
                      onClick={handleAddRestaurant}
                      className="mt-1 w-full rounded-lg border-t border-gray-100 px-4 py-2 text-left text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                    >
                      ＋ Add New Restaurant
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Dashboard locked until your first restaurant is created.
            </div>
          )}

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onToggle}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {currentRestaurant?.slug && (
              <a
                href={`https://menulia.net/menu/${currentRestaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                <ExternalLink className="h-5 w-5" />
                <span>🌐 View Live Menu</span>
              </a>
            )}
          </nav>

          <div className="border-t border-gray-100 pt-6">
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">Account</p>
                  <p className="text-xs text-gray-500">Sign out</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {profileOpen && (
                <div className="absolute bottom-full left-0 right-0 z-10 mb-2 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
                  {hasRestaurants && activeRestaurantId && (
                    <Link
                      href={`/dashboard/${activeRestaurantId}/settings`}
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Profile Settings
                    </Link>
                  )}
                  <Link
                    href="/logout"
                    className="block rounded-lg px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </Link>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onToggle}
            className="absolute right-5 top-5 rounded-lg p-2 transition-colors hover:bg-gray-100 md:hidden"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </aside>

      {hasRestaurants && (
        <AddRestaurantModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      )}
    </>
  );
}
