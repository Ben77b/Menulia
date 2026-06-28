import { cn } from "@/lib/utils";

const LOGO_ACCEPT =
  "image/png,image/jpeg,image/webp,image/svg+xml,.svg";

interface RestaurantLogoProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

/** Renders raster or SVG logos with native scaling — avoids Next/Image SVG clipping. */
export function RestaurantLogo({
  src,
  alt,
  className,
  wrapperClassName,
}: RestaurantLogoProps) {
  return (
    <div className={cn("flex items-center justify-center", wrapperClassName)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn("max-h-full max-w-full object-contain object-center", className)}
      />
    </div>
  );
}

export { LOGO_ACCEPT };
