"use client";

import { useMemo, useRef, useState } from "react";
import { useActiveRestaurant } from "@/hooks/use-active-restaurant";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getPublicMenuUrl } from "@/lib/site-url";
import { buildMenuEmbedSnippet } from "@/lib/menu-embed-snippet";
import { Button } from "@/components/ui/button";
import { Check, Code2, Copy, Download, Link2, QrCode, Share2 } from "lucide-react";
import QRCode from "react-qr-code";

export default function ShareMenuPage() {
  const { activeRestaurant, awaitingWorkspace } = useActiveRestaurant();
  const [qrColor, setQrColor] = useState("#000000");
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const restaurantUrl = activeRestaurant
    ? getPublicMenuUrl(activeRestaurant.slug)
    : getPublicMenuUrl("demo");

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

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.drawImage(img, 0, 0);

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
    return <LoadingSpinner label="Loading share tools…" />;
  }

  return (
    <div className="air-page space-y-8">
      <div>
        <h1 className="air-page-title">Share the Menu</h1>
        <p className="air-page-subtitle">
          QR codes, direct links, and website embeds — everything you need to put your menu in
          guests&apos; hands.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8 xl:col-span-2">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <QrCode className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Menu QR Code</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Print this code for tables, menus, or signage. Guests scan to open your live digital menu.
            </p>
          </div>

          <div className="flex flex-col items-start gap-8 lg:flex-row">
            <div className="air-card p-6">
              <div ref={qrRef}>
                <QRCode
                  value={restaurantUrl}
                  size={256}
                  fgColor={qrColor}
                  bgColor="transparent"
                  level="H"
                />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="air-label">QR Code Color</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(event) => setQrColor(event.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-[10px] border border-input"
                  />
                  <span className="text-sm text-muted-foreground">{qrColor}</span>
                </div>
              </div>

              <Button onClick={downloadQrCode} className="gap-2">
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Direct Link</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Share this URL in messages, social posts, or your Google Business profile.
            </p>
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
            {linkCopied ? "Copied!" : "Copy Link"}
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <Code2 className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Website Embed</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Paste this iframe into your website builder or HTML to embed your live menu.
            </p>
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
            {embedCopied ? "Copied!" : "Copy Embed Code"}
          </Button>
        </div>
      </div>

      <div className="air-card flex items-start gap-3 border-[#E5E5EA] bg-[#FAFAFA] p-4">
        <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <p className="text-sm text-muted-foreground">
          All share tools point to the same live public menu. Updates in Menu Builder appear
          instantly — no need to regenerate links or QR codes.
        </p>
      </div>
    </div>
  );
}
