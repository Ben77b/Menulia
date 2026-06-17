"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Eye, Languages, Share2, QrCode, X } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/lib/types";

interface DashboardHeaderProps {
  restaurant: Restaurant;
  onToggleSidebar: () => void;
}

export function DashboardHeader({ restaurant, onToggleSidebar }: DashboardHeaderProps) {
  const [langOpen, setLangOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dashboardLang, setDashboardLang] = useState<LanguageCode>("en");

  const currentLang = LANGUAGES.find((l) => l.code === dashboardLang)!;

  const shareUrl = `https://menulia.io/${restaurant.slug}`;

  return (
    <div className="border-b border-border bg-surface-elevated px-4 py-3 lg:px-6 lg:py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Menu toggle + Restaurant info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm text-text-secondary">
              Public menu:{" "}
              <a
                href={`/${restaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-brand hover:underline"
              >
                menulia.io/{restaurant.slug}
              </a>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Preview button */}
          <Link
            href="/dashboard/preview"
            className="flex items-center gap-2 rounded-lg bg-coral-cta px-3 py-2 text-sm font-medium text-white hover:bg-coral-cta/90 sm:px-4"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Link>

          {/* Share/QR button */}
          <div className="relative">
            <button
              onClick={() => { setShareOpen(!shareOpen); setLangOpen(false); }}
              className="rounded-lg p-2 hover:bg-muted"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
            {shareOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-border bg-white p-4 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Share menu</h3>
                    <button
                      onClick={() => setShareOpen(false)}
                      className="rounded p-1 hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-secondary">
                        Shareable link
                      </label>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={shareUrl}
                          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                          }}
                          className="rounded-lg bg-emerald-brand px-3 py-2 text-xs font-medium text-white hover:bg-emerald-brand/90"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-secondary">
                        QR Code
                      </label>
                      <button
                        onClick={() => {
                          // Generate QR code - would need a QR library
                          window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`, '_blank');
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                      >
                        <QrCode className="h-4 w-4" />
                        Generate QR Code
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => { setLangOpen(!langOpen); setShareOpen(false); }}
              className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted"
              aria-label="Change language"
            >
              <Languages className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">{currentLang.code.toUpperCase()}</span>
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-12 z-50 max-h-80 w-56 overflow-y-auto rounded-2xl border border-border bg-white p-1 shadow-xl">
                  <p className="px-3 py-2 text-xs font-medium text-text-secondary">
                    Dashboard Language
                  </p>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setDashboardLang(lang.code); setLangOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted",
                        dashboardLang === lang.code && "font-medium"
                      )}
                    >
                      <span>{lang.flag}</span>
                      {lang.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
