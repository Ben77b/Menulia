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
  const [qrCaption, setQrCaption] = useState("");
  const [logoObjectUrl, setLogoObjectUrl] = useState<string | null>(null);
  const [logoNaturalSize, setLogoNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  function handleLogoFile(file: File | null) {
    if (logoObjectUrl) {
      URL.revokeObjectURL(logoObjectUrl);
    }
    setLogoNaturalSize(null);
    if (!file) {
      setLogoObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLogoObjectUrl(url);
    const probe = new Image();
    probe.onload = () => {
      setLogoNaturalSize({ w: probe.naturalWidth || 1, h: probe.naturalHeight || 1 });
    };
    probe.src = url;
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

    const caption = qrCaption.trim();
    const hasCaption = caption.length > 0;
    const hasLogo = Boolean(logoObjectUrl);
    const textPad = hasCaption ? Math.round(QR_EXPORT_SIZE * 0.12) : 0;
    const qrDrawSize = QR_EXPORT_SIZE - textPad;

    const finishDownload = () => {
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `menu-qr-${activeRestaurant?.slug || "restaurant"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const drawOverlaysAndFinish = () => {
      if (hasLogo && logoObjectUrl) {
        const logoImg = new Image();
        logoImg.onload = () => {
          const logoBox = Math.round(qrDrawSize * 0.22);
          const clearPad = Math.round(logoBox * 0.18);
          const clearSize = logoBox + clearPad * 2;
          const clearX = Math.round((qrDrawSize - clearSize) / 2);
          const clearY = Math.round((qrDrawSize - clearSize) / 2);

          // Clear a quiet central square so the logo does not sit on live modules
          if (transparentBackground) {
            ctx.clearRect(clearX, clearY, clearSize, clearSize);
          } else {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(clearX, clearY, clearSize, clearSize);
          }

          const aspect =
            (logoNaturalSize?.w ?? (logoImg.naturalWidth || 1)) /
            (logoNaturalSize?.h ?? (logoImg.naturalHeight || 1));
          let drawW = logoBox;
          let drawH = logoBox;
          if (aspect > 1) {
            drawH = Math.round(logoBox / aspect);
          } else {
            drawW = Math.round(logoBox * aspect);
          }
          const logoX = Math.round((qrDrawSize - drawW) / 2);
          const logoY = Math.round((qrDrawSize - drawH) / 2);
          ctx.drawImage(logoImg, logoX, logoY, drawW, drawH);

          if (hasCaption) {
            ctx.fillStyle = qrColor;
            ctx.font = `600 ${Math.round(QR_EXPORT_SIZE * 0.045)}px system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(caption, QR_EXPORT_SIZE / 2, qrDrawSize + textPad / 2, QR_EXPORT_SIZE * 0.9);
          }
          finishDownload();
        };
        logoImg.onerror = () => {
          if (hasCaption) {
            ctx.fillStyle = qrColor;
            ctx.font = `600 ${Math.round(QR_EXPORT_SIZE * 0.045)}px system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(caption, QR_EXPORT_SIZE / 2, qrDrawSize + textPad / 2, QR_EXPORT_SIZE * 0.9);
          }
          finishDownload();
        };
        logoImg.src = logoObjectUrl;
        return;
      }

      if (hasCaption) {
        ctx.fillStyle = qrColor;
        ctx.font = `600 ${Math.round(QR_EXPORT_SIZE * 0.045)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(caption, QR_EXPORT_SIZE / 2, qrDrawSize + textPad / 2, QR_EXPORT_SIZE * 0.9);
      }
      finishDownload();
    };

    const img = new Image();
    img.onload = () => {
      canvas.width = QR_EXPORT_SIZE;
      canvas.height = QR_EXPORT_SIZE;

      if (!transparentBackground) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Raw QR fills the full canvas when no caption/logo padding is needed
      ctx.drawImage(img, 0, 0, qrDrawSize, qrDrawSize);

      if (!hasLogo && !hasCaption) {
        finishDownload();
        return;
      }

      drawOverlaysAndFinish();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  if (awaitingWorkspace) {
    return <LoadingSpinner label={t("share.loading")} />;
  }

  return (
    <div className="air-page w-full space-y-6 sm:space-y-8">
      <div className="w-full min-w-0">
        <h1 className="air-page-title">{t("share.pageTitle")}</h1>
        <p className="air-page-subtitle">{t("share.pageSubtitle")}</p>
      </div>

      <div className="flex w-full flex-col gap-6 lg:grid lg:grid-cols-12">
        {/* QR customizer — full width on mobile */}
        <div className="w-full min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:col-span-7">
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center gap-3">
              <QrCode className="h-5 w-5 shrink-0 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">{t("share.qrTitle")}</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{t("share.qrDescription")}</p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-6 sm:items-start lg:flex-row lg:gap-8">
            <div
              className={cn(
                "mx-auto w-full max-w-[min(100%,280px)] shrink-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:mx-0 sm:p-5",
                transparentBackground &&
                  "bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb),linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%,#e5e7eb)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]"
              )}
            >
              <div ref={qrRef} className="relative w-full [&_svg]:!h-auto [&_svg]:!w-full">
                <QRCode
                  value={restaurantUrl}
                  size={QR_PREVIEW_SIZE}
                  fgColor={qrColor}
                  bgColor={qrBackground}
                  level="H"
                />
                {logoObjectUrl ? (
                  <div className="pointer-events-none absolute inset-[39%] overflow-hidden rounded-md bg-white/95 p-1 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoObjectUrl} alt="" className="h-full w-full object-contain" />
                  </div>
                ) : null}
              </div>
              {qrCaption.trim() ? (
                <p
                  className="mt-3 text-center text-sm font-semibold tracking-wide"
                  style={{ color: qrColor }}
                >
                  {qrCaption.trim()}
                </p>
              ) : null}
            </div>

            <div className="flex w-full min-w-0 flex-1 flex-col gap-5">
              <div>
                <label className="air-label">{t("share.qrColor")}</label>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:gap-3">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(event) => setQrColor(event.target.value)}
                    className="h-11 min-h-11 w-14 min-w-11 cursor-pointer rounded-[10px] border border-input bg-white p-1"
                    aria-label={t("share.qrColor")}
                  />
                  <span className="font-mono text-sm text-muted-foreground">{qrColor}</span>
                  <div className="flex flex-wrap items-center gap-1">
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
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-transform active:scale-95"
                        >
                          <span
                            className={cn(
                              "h-7 w-7 rounded-full border-2",
                              active
                                ? "border-slate-900 ring-2 ring-slate-900/15 ring-offset-1"
                                : "border-white shadow-[0_0_0_1px_rgba(15,23,42,0.12)]"
                            )}
                            style={{ backgroundColor: preset.value }}
                            aria-hidden
                          />
                        </button>
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

              <div>
                <label className="air-label">{t("share.qrLogo")}</label>
                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="sr-only"
                    onChange={(event) => handleLogoFile(event.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {logoObjectUrl ? t("share.qrLogoChange") : t("share.qrLogoUpload")}
                  </button>
                  {logoObjectUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleLogoFile(null);
                        if (logoInputRef.current) logoInputRef.current.value = "";
                      }}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    >
                      {t("share.qrLogoRemove")}
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="air-label" htmlFor="qr-caption">
                  {t("share.qrCaption")}
                </label>
                <input
                  id="qr-caption"
                  type="text"
                  value={qrCaption}
                  maxLength={24}
                  onChange={(event) => setQrCaption(event.target.value)}
                  placeholder="Scan Me"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5"
                />
              </div>

              <Button onClick={downloadQrCode} className="min-h-11 w-full gap-2 sm:w-auto sm:self-start">
                <Download className="h-4 w-4" />
                {t("share.downloadQr")}
              </Button>
            </div>
          </div>
        </div>

        {/* Link + Embed — stacked beneath QR on mobile */}
        <div className="flex w-full min-w-0 flex-col gap-6 lg:col-span-5">
          <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 md:p-8">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 shrink-0 text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900">
                  {t("share.directLinkTitle")}
                </h2>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{t("share.directLinkDescription")}</p>
            </div>

            <div className="flex flex-col items-stretch gap-2 rounded-xl bg-slate-50 p-2 sm:flex-row sm:items-center">
              <input
                type="text"
                readOnly
                value={restaurantUrl}
                aria-label={t("share.directLinkTitle")}
                className="min-h-11 min-w-0 flex-1 truncate border-0 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={() => void copyText(restaurantUrl, setLinkCopied)}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                aria-label={linkCopied ? t("common.copied") : t("common.copyLink")}
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sm:hidden">{linkCopied ? t("common.copied") : t("common.copyLink")}</span>
              </button>
            </div>

            <a
              href={restaurantUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
            >
              {t("share.viewLiveMenu")}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>

          <div className="w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 md:p-8">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 shrink-0 text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900">{t("share.embedTitle")}</h2>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{t("share.embedDescription")}</p>
            </div>

            <div className="flex flex-col items-stretch gap-2 rounded-xl bg-slate-50 p-2 sm:flex-row sm:items-center">
              <input
                type="text"
                readOnly
                value={embedSnippet}
                aria-label={t("share.embedTitle")}
                className="min-h-11 min-w-0 flex-1 truncate border-0 bg-transparent px-3 py-2 font-mono text-xs text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={() => void copyText(embedSnippet, setEmbedCopied)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
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

      <div className="air-card flex w-full items-start gap-3 border-[#E5E5EA] bg-[#FAFAFA] p-4">
        <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <p className="min-w-0 text-sm text-muted-foreground">{t("share.footerNote")}</p>
      </div>
    </div>
  );
}
