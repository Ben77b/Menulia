"use client";

import { useState } from "react";
import { Home, LayoutTemplate, Palette, Settings, User, ChevronDown, Building2, X, QrCode, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRestaurant } from "@/contexts/restaurant-context";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [restaurantOpen, setRestaurantOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { currentRestaurant, setCurrentRestaurant, restaurants } = useRestaurant();

  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: LayoutTemplate, label: "Menu Builder", href: "/dashboard/menu" },
    { icon: Palette, label: "Branding & Design", href: "/dashboard/branding" },
    { icon: QrCode, label: "QR Code", href: "/dashboard/qr" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
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
          {/* Logo */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">Menulia</h1>
          </div>

          {/* Restaurant/Brand Switcher */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="relative">
              <button
                onClick={() => setRestaurantOpen(!restaurantOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Building2 className="h-5 w-5 text-gray-600" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {currentRestaurant?.name || "Select Restaurant"}
                  </p>
                  <p className="text-xs text-gray-500">Switch restaurant</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {restaurantOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white p-2 shadow-xl z-10">
                  {restaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      onClick={() => {
                        setCurrentRestaurant(restaurant);
                        setRestaurantOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {restaurant.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Live Menu Button */}
            {currentRestaurant?.slug && (
              <a
                href={`https://menulia.net/${currentRestaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                View Live Menu
              </a>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onToggle}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile/Account Settings */}
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
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Profile Settings
                  </Link>
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

          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className="md:hidden absolute top-5 right-5 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </aside>
    </>
  );
}
