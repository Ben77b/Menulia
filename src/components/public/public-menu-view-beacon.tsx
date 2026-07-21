"use client";

import { useEffect, useRef } from "react";
import {
  detectDeviceType,
  normalizeViewLanguage,
} from "@/lib/menu-views";

type PublicMenuViewBeaconProps = {
  restaurantId: string;
};

function sessionKey(restaurantId: string) {
  return `menulia:menu-view:${restaurantId}`;
}

/**
 * Silent GDPR-safe view ping. Never blocks rendering; failures are swallowed.
 */
export function PublicMenuViewBeacon({ restaurantId }: PublicMenuViewBeaconProps) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (!restaurantId || sentRef.current) return;
    sentRef.current = true;

    try {
      if (typeof window !== "undefined") {
        const already = sessionStorage.getItem(sessionKey(restaurantId));
        if (already === "1") return;
        sessionStorage.setItem(sessionKey(restaurantId), "1");
      }
    } catch {
      // sessionStorage may be blocked — still attempt one ping
    }

    const language = normalizeViewLanguage(
      typeof navigator !== "undefined" ? navigator.language : "en"
    );
    const deviceType = detectDeviceType(
      typeof navigator !== "undefined" ? navigator.userAgent : ""
    );

    void fetch("/api/menu-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        language,
        device_type: deviceType,
      }),
      keepalive: true,
    }).catch((error) => {
      console.error("[Supabase Audit Error]:", "menu-views.beacon", error);
    });
  }, [restaurantId]);

  return null;
}
