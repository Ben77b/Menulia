"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-200/80 bg-white text-slate-900",
  error: "border-red-200/80 bg-white text-slate-900",
  info: "border-border bg-white text-slate-900",
};

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: AlertCircle,
};

const VARIANT_ICON_COLOR: Record<ToastVariant, string> = {
  success: "text-emerald-brand-dark",
  error: "text-red-500",
  info: "text-slate-500",
};

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = VARIANT_ICONS[item.variant];

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), 3800);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.1)] air-toast-enter",
        VARIANT_STYLES[item.variant]
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", VARIANT_ICON_COLOR[item.variant])} />
      <p className="flex-1 text-sm leading-relaxed">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="rounded-lg p-1 text-slate-400 transition-colors duration-200 hover:bg-muted hover:text-slate-700"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant) => {
    idRef.current += 1;
    const id = `toast-${idRef.current}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, variant }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: {
        success: (message) => push(message, "success"),
        error: (message) => push(message, "error"),
        info: (message) => push(message, "info"),
      },
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-60 flex w-[min(100vw-2rem,24rem)] flex-col gap-2"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context.toast;
}
