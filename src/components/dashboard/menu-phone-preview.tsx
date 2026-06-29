"use client";

import type { ReactNode } from "react";

interface MenuPhonePreviewProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export function MenuPhonePreview({
  children,
  label = "Live Preview",
  className = "",
}: MenuPhonePreviewProps) {
  return (
    <div
      className={`flex flex-col items-center justify-start rounded-xl border border-gray-200 bg-gradient-to-b from-gray-100 to-gray-200 p-4 lg:p-6 ${className}`}
    >
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="relative w-full max-w-[390px] shrink-0">
        <div className="overflow-hidden rounded-[2.75rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl">
          <div className="flex items-center justify-center bg-gray-900 py-2">
            <div className="h-1 w-16 rounded-full bg-gray-700" />
          </div>
          <div className="h-[720px] overflow-y-auto bg-white">{children}</div>
          <div className="flex items-center justify-center bg-gray-900 py-3">
            <div className="h-1 w-28 rounded-full bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
