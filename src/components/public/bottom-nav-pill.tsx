"use client";

import { cn } from "@/lib/utils";

interface BottomNavPillProps {
  activeView: "menu" | "reservation";
  onViewChange: (view: "menu" | "reservation") => void;
  showReservation: boolean;
  accentColor?: string;
}

export function BottomNavPill({
  activeView,
  onViewChange,
  showReservation,
  accentColor = "#047857",
}: BottomNavPillProps) {
  if (!showReservation) return null;

  return (
    <nav className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
      <div className="relative flex rounded-full bg-white p-1 shadow-lg ring-1 ring-border">
        <div
          className={cn(
            "absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out"
          )}
          style={{
            backgroundColor: accentColor,
            transform:
              activeView === "reservation"
                ? "translateX(calc(100% + 4px))"
                : "translateX(4px)",
          }}
        />
        <button
          onClick={() => onViewChange("menu")}
          className={cn(
            "relative z-10 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
            activeView === "menu" ? "text-white" : "text-text-secondary"
          )}
        >
          Explore Menu
        </button>
        <button
          onClick={() => onViewChange("reservation")}
          className={cn(
            "relative z-10 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
            activeView === "reservation" ? "text-white" : "text-text-secondary"
          )}
        >
          Book a Table
        </button>
      </div>
    </nav>
  );
}
