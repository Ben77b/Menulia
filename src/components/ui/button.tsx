import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export type ButtonVariant =
  | "dark"
  | "light"
  | "ghost"
  | "danger"
  | "link"
  | "primary"
  | "secondary"
  /** @deprecated Use `dark` */
  | "air"
  /** @deprecated Use `light` */
  | "outline";

export type ButtonSize = "sm" | "md" | "lg";

type ResolvedVariant = "dark" | "light" | "ghost" | "danger" | "link" | "primary" | "secondary";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isExternal?: boolean;
  className?: string;
  children?: React.ReactNode;
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
};

export type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;

const INTERACTION =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const VARIANT_STYLES: Record<ResolvedVariant, string> = {
  dark: "bg-slate-900 text-white border border-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-slate-800 hover:shadow-[0_4px_12px_rgba(0,0,0,0.14)]",
  light:
    "bg-white text-slate-900 border border-neutral-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-neutral-50 hover:border-neutral-300/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
  ghost: "bg-transparent text-slate-800 shadow-none hover:bg-neutral-100/80",
  link: "bg-transparent text-neutral-600 underline-offset-4 shadow-none hover:text-slate-900 hover:underline active:scale-100",
  danger: "bg-red-500 text-white border border-red-500 shadow-sm hover:bg-red-600 hover:opacity-95",
  primary:
    "bg-coral-cta text-white border border-coral-cta shadow-[0_2px_8px_rgba(255,107,74,0.25)] hover:bg-coral-cta-dark hover:shadow-[0_4px_12px_rgba(255,107,74,0.3)]",
  secondary:
    "bg-emerald-brand text-white border border-emerald-brand shadow-sm hover:bg-emerald-brand-dark hover:opacity-95",
};

const BUTTON_HEIGHT = "h-10 min-h-10 shrink-0";

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: `${BUTTON_HEIGHT} px-3 text-sm rounded-xl`,
  md: `${BUTTON_HEIGHT} px-4 text-sm rounded-xl`,
  lg: `${BUTTON_HEIGHT} px-5 text-sm rounded-xl`,
};

function resolveVariant(variant: ButtonVariant): ResolvedVariant {
  if (variant === "air") return "dark";
  if (variant === "outline") return "light";
  return variant;
}

function shouldShowExternalIcon(
  isExternal: boolean | undefined,
  target: string | undefined,
  href: string | undefined
): boolean {
  if (isExternal === true) return true;
  if (isExternal === false) return false;
  return target === "_blank" || Boolean(href?.startsWith("http"));
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      className,
      variant = "dark",
      size = "md",
      isExternal,
      children,
      href,
      target,
      rel,
      ...props
    },
    ref
  ) => {
    const resolved = resolveVariant(variant);
    const showExternal = shouldShowExternalIcon(isExternal, target, href);
    const externalRel =
      target === "_blank" ? rel ?? "noopener noreferrer" : rel;

    const classes = cn(
      INTERACTION,
      VARIANT_STYLES[resolved],
      resolved !== "link" && resolved !== "ghost" && "shadow-sm",
      SIZE_STYLES[size],
      className
    );

    const content = (
      <>
        {children}
        {showExternal && (
          <ArrowUpRight
            className="h-3.5 w-3.5 shrink-0 opacity-80"
            strokeWidth={2}
            aria-hidden
          />
        )}
      </>
    );

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={externalRel}
          className={classes}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        {...props}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";
