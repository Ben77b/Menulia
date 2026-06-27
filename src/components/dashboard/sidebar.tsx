"use client";

import { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Home, LayoutTemplate, Palette, Settings, User, ChevronDown, Building2, X, QrCode, ExternalLink, Check } from "lucide-react";
import Link from "next/link";
import { useRestaurant } from "@/contexts/restaurant-context";
import { AddRestaurantModal } from "@/components/dashboard/add-restaurant-modal";
import { getPublicMenuUrl } from "@/lib/site-url";

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
  const { currentRestaurant, restaurants, switchRestaurant, loading, authReady, user } = useRestaurant();

  const activeRestaurantId =
    restaurantId ?? currentRestaurant?.id ?? restaurants[0]?.id;

  const navItems = user && activeRestaurantId
    ? [
        { icon: Home, label: "Home", href: `/dashboard/${activeRestaurantId}` },
        { icon: LayoutTemplate, label: "Menu Builder", href: `/dashboard/${activeRestaurantId}/menu` },
        { icon: Palette, label: "Branding & Design", href: `/dashboard/${activeRestaurantId}/branding` },
        { icon: QrCode, label: "QR Code", href: `/dashboard/${activeRestaurantId}/qr` },
        { icon: Settings, label: "Settings", href: `/dashboard/${activeRestaurantId}/settings` },
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
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
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
        <div className="flex flex-col h-full p-5">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">Menulia</h1>
          </div>

          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="relative">
              <button
                onClick={() => setRestaurantOpen(!restaurantOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
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
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentRestaurant?.name || "Select Restaurant"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {loading ? "Loading..." : `${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"}`}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${restaurantOpen ? "rotate-180" : ""}`} />
              </button>

              {restaurantOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white p-2 shadow-xl z-10 max-h-64 overflow-y-auto">
                  {restaurants.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-gray-500">No restaurants yet</p>
                  ) : (
                    restaurants.map((restaurant) => {
                      const isActive = restaurant.id === activeRestaurantId;
                      return (
                        <button
                          key={restaurant.id}
                          onClick={() => handleRestaurantSwitch(restaurant.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
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
                          <span className="flex-1 text-left truncate">{restaurant.name}</span>
                          {isActive && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                  <button
                    onClick={handleAddRestaurant}
                    className="w-full text-left px-4 py-2 mt-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium border-t border-gray-100"
                  >
                    ＋ Add New Restaurant
                  </button>
                </div>
              )}
            </div>

            {currentRestaurant?.slug && (
              <a
                href={getPublicMenuUrl(currentRestaurant.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                View Live Menu
              </a>
            )}
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onToggle}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
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
          </nav>

          <div className="pt-6 border-t border-gray-100">
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">Account</p>
                  <p className="text-xs text-gray-500">Settings</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {profileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-gray-200 bg-white p-2 shadow-xl z-10">
                  {activeRestaurantId && (
                    <Link
                      href={`/dashboard/${activeRestaurantId}/settings`}
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      Profile Settings
                    </Link>
                  )}
                  <Link
                    href="/logout"
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Sign Out
                  </Link>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onToggle}
            className="md:hidden absolute top-5 right-5 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </aside>

      <AddRestaurantModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </>
  );
}
