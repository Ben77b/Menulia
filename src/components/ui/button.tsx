import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "air" | "link";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "air", size = "md", children, ...props }, ref) => {
    const variants = {
      air: "bg-slate-900 hover:bg-slate-800 text-white shadow-[0_2px_12px_rgba(0,0,0,0.12)]",
      primary: "bg-coral-cta hover:bg-coral-cta-dark text-white shadow-sm",
      secondary: "bg-emerald-brand hover:bg-emerald-brand-dark text-white",
      ghost: "hover:bg-muted text-slate-800",
      link: "text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline shadow-none",
      danger: "bg-red-500 hover:bg-red-600 text-white",
      outline: "border border-border bg-card hover:bg-[#FAFAFA] text-slate-800",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-[10px]",
      md: "px-4 py-2 text-sm rounded-[10px]",
      lg: "px-6 py-3 text-base rounded-[12px]",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
          variant !== "link" && "shadow-sm",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
