"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  symbol?: string;
  wrapperClassName?: string;
};

export function CurrencyInput({
  symbol = "€",
  className,
  wrapperClassName,
  ...props
}: CurrencyInputProps) {
  return (
    <div
      className={cn(
        "flex items-center rounded-xl border border-slate-200 bg-white transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20",
        wrapperClassName
      )}
    >
      <span className="select-none pl-3 pr-1 font-medium text-slate-400">{symbol}</span>
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "w-full border-0 bg-transparent p-2.5 text-sm text-slate-900 outline-none focus:ring-0",
          className
        )}
        {...props}
      />
    </div>
  );
}
