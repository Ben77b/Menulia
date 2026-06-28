"use client";

import { useEffect } from "react";

interface PublicMenuDocumentBackgroundProps {
  /** headerFooterBackgroundColor / header background from restaurant theme */
  color: string;
}

export function PublicMenuDocumentBackground({ color }: PublicMenuDocumentBackgroundProps) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.backgroundColor;
    const prevBodyBg = body.style.backgroundColor;

    html.style.backgroundColor = color;
    body.style.backgroundColor = color;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const prevThemeColor = themeMeta?.getAttribute("content") ?? null;
    themeMeta?.setAttribute("content", color);

    return () => {
      html.style.backgroundColor = prevHtmlBg;
      body.style.backgroundColor = prevBodyBg;
      if (themeMeta) {
        if (prevThemeColor) {
          themeMeta.setAttribute("content", prevThemeColor);
        } else {
          themeMeta.removeAttribute("content");
        }
      }
    };
  }, [color]);

  return null;
}
