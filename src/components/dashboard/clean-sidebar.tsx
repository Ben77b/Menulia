"use client";

import { useState } from "react";
import { Home, LayoutTemplate, Palette, Calendar, User, ChevronDown } from "lucide-react";
import Link from "next/link";

interface CleanSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function CleanSidebar({ isOpen, onToggle }: CleanSidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: LayoutTemplate, label: "Menu Builder", href: "/dashboard/menu" },
    { icon: Palette, label: "Branding & Design", href: "/dashboard/branding" },
    { icon: Calendar, label: "Reservations", href: "/dashboard/reservations" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
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
          bg-white border-r border-gray-100 p-5
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:w-64
        `}
      >
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">menulia.io</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </a>
          ))}
        </nav>

        {/* Account Selector/Profile Dropdown */}
        <div className="absolute bottom-5 left-5 right-5">
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
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
                <Link
                  href="/settings"
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
      </aside>
    </>
  );
}
