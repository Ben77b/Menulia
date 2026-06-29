import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "air";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants = {
      primary: "bg-coral-cta hover:bg-coral-cta-dark text-white shadow-sm",
      secondary: "bg-emerald-brand hover:bg-emerald-brand-dark text-white",
      air: "bg-slate-900 hover:bg-slate-800 text-white shadow-[0_2px_12px_rgba(0,0,0,0.12)]",
      ghost: "hover:bg-[#F5F5F7] text-text-primary",
      danger: "bg-red-500 hover:bg-red-600 text-white",
      outline: "border border-[#E5E5EA] bg-white hover:bg-[#FAFAFA] text-slate-800",
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
          "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
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
