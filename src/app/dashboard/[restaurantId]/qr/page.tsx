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
import { Check, Code2, Copy, Download, Link2, QrCode, Share2 } from "lucide-react";
import QRCode from "react-qr-code";

const QR_PREVIEW_SIZE = 256;
const QR_EXPORT_SIZE = 1024;

export default function ShareMenuPage() {
  const { activeRestaurant, awaitingWorkspace } = useActiveRestaurant();
  const { t } = useDashboardLocale();
  const [qrColor, setQrColor] = useState("#000000");
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

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8 xl:col-span-2">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <QrCode className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">{t("share.qrTitle")}</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">{t("share.qrDescription")}</p>
          </div>

          <div className="flex flex-col items-start gap-8 lg:flex-row">
            <div
              className={cn(
                "air-card p-6",
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

            <div className="flex w-full max-w-md flex-1 flex-col gap-5">
              <div>
                <label className="air-label">{t("share.qrColor")}</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(event) => setQrColor(event.target.value)}
                    className="h-11 w-16 cursor-pointer rounded-[10px] border border-input"
                    aria-label={t("share.qrColor")}
                  />
                  <span className="font-mono text-sm text-muted-foreground">{qrColor}</span>
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

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">{t("share.directLinkTitle")}</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">{t("share.directLinkDescription")}</p>
          </div>
          <div className="rounded-[10px] border border-border bg-muted p-3">
            <code className="break-all text-sm text-slate-700">{restaurantUrl}</code>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full gap-2"
            onClick={() => void copyText(restaurantUrl, setLinkCopied)}
          >
            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {linkCopied ? t("common.copied") : t("common.copyLink")}
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <Code2 className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">{t("share.embedTitle")}</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">{t("share.embedDescription")}</p>
          </div>
          <pre className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-800">
            <code>{embedSnippet}</code>
          </pre>
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full gap-2"
            onClick={() => void copyText(embedSnippet, setEmbedCopied)}
          >
            {embedCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {embedCopied ? t("common.copied") : t("common.copyEmbed")}
          </Button>
        </div>
      </div>

      <div className="air-card flex items-start gap-3 border-[#E5E5EA] bg-[#FAFAFA] p-4">
        <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <p className="text-sm text-muted-foreground">{t("share.footerNote")}</p>
      </div>
    </div>
  );
}
