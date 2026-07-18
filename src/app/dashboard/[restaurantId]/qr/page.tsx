"use client";

import { useMemo, useRef, useState } from "react";
import { useActiveRestaurant } from "@/hooks/use-active-restaurant";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ToggleSwitch } from "@/components/dashboard/toggle-switch";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { getPublicMenuUrl } from "@/lib/site-url";
import { buildMenuEmbedSnippet } from "@/lib/menu-embed-snippet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  Download,
  Link2,
  QrCode,
  Share2,
} from "lucide-react";
import QRCode from "react-qr-code";

const QR_PREVIEW_SIZE = 256;
const QR_EXPORT_SIZE = 1024;

const QR_COLOR_PRESETS = [
  { label: "Charcoal Black", value: "#111111" },
  { label: "Minimal Slate", value: "#475569" },
  { label: "Deep Burgundy", value: "#7F1D1D" },
  { label: "Forest Green", value: "#14532D" },
] as const;

export default function ShareMenuPage() {
  const { activeRestaurant, awaitingWorkspace } = useActiveRestaurant();
  const { t } = useDashboardLocale();
  const [qrColor, setQrColor] = useState("#111111");
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const restaurantUrl = activeRestaurant
    ? getPublicMenuUrl(activeRestaurant.slug)
    : getPublicMenuUrl("demo");

  const qrBackground = transparentBackground ? "transparent" : "#ffffff";

  const embedSnippet = useMemo(
    () =>
      activeRestaurant
        ? buildMenuEmbedSnippet(activeRestaurant.slug, activeRestaurant.name)
        : buildMenuEmbedSnippet("demo", "Restaurant"),
    [activeRestaurant]
  );

  async function copyText(text: string, setCopied: (value: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("[ShareMenu:Clipboard]", error);
    }
  }

  function downloadQrCode() {
    if (!qrRef.current) return;

    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    const exportSvg = svgElement.cloneNode(true) as SVGSVGElement;
    exportSvg.setAttribute("width", String(QR_EXPORT_SIZE));
    exportSvg.setAttribute("height", String(QR_EXPORT_SIZE));

    const svgData = new XMLSerializer().serializeToString(exportSvg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = QR_EXPORT_SIZE;
      canvas.height = QR_EXPORT_SIZE;

      if (!transparentBackground) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0, QR_EXPORT_SIZE, QR_EXPORT_SIZE);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `menu-qr-${activeRestaurant?.slug || "restaurant"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  if (awaitingWorkspace) {
    return <LoadingSpinner label={t("share.loading")} />;
  }

  return (
    <div className="air-page space-y-8">
      <div>
        <h1 className="air-page-title">{t("share.pageTitle")}</h1>
        <p className="air-page-subtitle">{t("share.pageSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left — QR customizer */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8 lg:col-span-7">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <QrCode className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">{t("share.qrTitle")}</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">{t("share.qrDescription")}</p>
          </div>

          <div className="flex flex-col items-start gap-8 sm:flex-row">
            <div
              className={cn(
                "shrink-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
                transparentBackground &&
                  "bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]"
              )}
            >
              <div ref={qrRef}>
                <QRCode
                  value={restaurantUrl}
                  size={QR_PREVIEW_SIZE}
                  fgColor={qrColor}
                  bgColor={qrBackground}
                  level="H"
                />
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-1 flex-col gap-5">
              <div>
                <label className="air-label">{t("share.qrColor")}</label>
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(event) => setQrColor(event.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-[10px] border border-input bg-white p-1"
                    aria-label={t("share.qrColor")}
                  />
                  <span className="font-mono text-sm text-muted-foreground">{qrColor}</span>
                  <div className="flex items-center gap-2">
                    {QR_COLOR_PRESETS.map((preset) => {
                      const active = qrColor.toLowerCase() === preset.value.toLowerCase();
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          title={preset.label}
                          aria-label={preset.label}
                          aria-pressed={active}
                          onClick={() => setQrColor(preset.value)}
                          className={cn(
                            "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                            active
                              ? "border-slate-900 ring-2 ring-slate-900/15 ring-offset-1"
                              : "border-white shadow-[0_0_0_1px_rgba(15,23,42,0.12)]"
                          )}
                          style={{ backgroundColor: preset.value }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <ToggleSwitch
                label={t("share.transparentBg")}
                description={t("share.transparentBgDescription")}
                checked={transparentBackground}
                onChange={setTransparentBackground}
              />

              <Button onClick={downloadQrCode} className="gap-2 self-start">
                <Download className="h-4 w-4" />
                {t("share.downloadQr")}
              </Button>
            </div>
          </div>
        </div>

        {/* Right — distribution cards */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900">
                  {t("share.directLinkTitle")}
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-400">{t("share.directLinkDescription")}</p>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2 py-1.5">
              <input
                type="text"
                readOnly
                value={restaurantUrl}
                aria-label={t("share.directLinkTitle")}
                className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={() => void copyText(restaurantUrl, setLinkCopied)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
                aria-label={linkCopied ? t("common.copied") : t("common.copyLink")}
              >
                {linkCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <a
              href={restaurantUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
            >
              {t("share.viewLiveMenu")}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900">{t("share.embedTitle")}</h2>
              </div>
              <p className="mt-1 text-xs text-slate-400">{t("share.embedDescription")}</p>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2 py-1.5">
              <input
                type="text"
                readOnly
                value={embedSnippet}
                aria-label={t("share.embedTitle")}
                className="min-w-0 flex-1 truncate border-0 bg-transparent px-2 py-2 font-mono text-xs text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={() => void copyText(embedSnippet, setEmbedCopied)}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                aria-label={embedCopied ? t("common.copied") : t("share.copySnippet")}
              >
                {embedCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{t("common.copied")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{t("share.copySnippet")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="air-card flex items-start gap-3 border-[#E5E5EA] bg-[#FAFAFA] p-4">
        <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <p className="text-sm text-muted-foreground">{t("share.footerNote")}</p>
      </div>
    </div>
  );
}
