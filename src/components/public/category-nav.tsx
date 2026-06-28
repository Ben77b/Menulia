"use client";

import { useEffect, useState } from "react";
import { contrastingTextColor } from "@/lib/contrast";

export interface PublicMenuCategoryLink {
  id: string;
  name: string;
}

interface CategoryNavProps {
  categories: PublicMenuCategoryLink[];
  stripBackgroundColor: string;
  accentColor: string;
}

export function CategoryNav({ categories, stripBackgroundColor, accentColor }: CategoryNavProps) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const stripTextColor = contrastingTextColor(stripBackgroundColor);
  const accentFillTextColor = contrastingTextColor(accentColor);

  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id.replace("category-", ""));
          }
        });
      },
      { threshold: 0.35, rootMargin: "-30% 0px -55% 0px" }
    );

    categories.forEach((category) => {
      const element = document.getElementById(`category-${category.id}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) return null;

  return (
    <nav
      className="sticky top-[88px] z-40 flex gap-2 overflow-x-auto border-b border-black/5 px-4 py-3 scrollbar-hide"
      style={{ backgroundColor: stripBackgroundColor, color: stripTextColor }}
    >
      {categories.map((category) => {
        const isActive = activeId === category.id;

        return (
          <a
            key={category.id}
            href={`#category-${category.id}`}
            className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200"
            style={
              isActive
                ? {
                    backgroundColor: accentColor,
                    border: `2px solid ${accentColor}`,
                    color: accentFillTextColor,
                  }
                : {
                    backgroundColor: "transparent",
                    border: `2px solid ${accentColor}`,
                    color: accentColor,
                  }
            }
            onMouseEnter={(e) => {
              if (isActive) return;
              e.currentTarget.style.backgroundColor = accentColor;
              e.currentTarget.style.color = accentFillTextColor;
            }}
            onMouseLeave={(e) => {
              if (isActive) return;
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = accentColor;
            }}
          >
            {category.name}
          </a>
        );
      })}
    </nav>
  );
}
