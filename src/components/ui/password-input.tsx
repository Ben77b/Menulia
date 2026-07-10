"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  className,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn("air-input pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setShowPassword((visible) => !visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-[#F5F5F7] hover:text-slate-600"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
