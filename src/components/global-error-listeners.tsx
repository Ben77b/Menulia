"use client";

import { useEffect } from "react";

export function GlobalErrorListeners() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error("Global captured error:", event.error);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Global captured rejection:", event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
