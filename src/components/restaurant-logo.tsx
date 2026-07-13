"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/public-menu-utils";

const LOGO_ACCEPT =
  "image/png,image/jpeg,image/webp,image/svg+xml,.svg";

interface RestaurantLogoProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  /** Shown when the logo URL is missing or fails to load */
  fallbackText?: string;
}

function LogoPlaceholder({
  label,
  className,
  wrapperClassName,
}: {
  label: string;
  className?: string;
  wrapperClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-black/5 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.15em] text-inherit",
        wrapperClassName,
        className
      )}
      aria-hidden
    >
      {label.slice(0, 24)}
    </div>
  );
}

/** Renders raster or SVG logos with native scaling — avoids Next/Image SVG clipping. */
export function RestaurantLogo({
  src,
  alt,
  className,
  wrapperClassName,
  fallbackText,
}: RestaurantLogoProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const imageSrc = normalizeImageUrl(src);

  if (!imageSrc || loadFailed) {
    if (fallbackText?.trim()) {
      return (
        <LogoPlaceholder
          label={fallbackText}
          className={className}
          wrapperClassName={wrapperClassName}
        />
      );
    }
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center", wrapperClassName)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={alt}
        className={cn("max-h-full max-w-full object-contain object-center", className)}
        onError={() => setLoadFailed(true)}
      />
    </div>
  );
}

export { LOGO_ACCEPT };
