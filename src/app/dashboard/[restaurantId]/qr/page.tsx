"use client";

import { useState, useRef } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { getPublicMenuUrl } from "@/lib/site-url";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";
import QRCode from "react-qr-code";

export default function QrCodePage() {
  const { currentRestaurant } = useRestaurant();
  const [qrColor, setQrColor] = useState("#000000");
  const qrRef = useRef<HTMLDivElement>(null);

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
      link.download = `qr-code-${currentRestaurant?.slug || "restaurant"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  const restaurantUrl = currentRestaurant
    ? getPublicMenuUrl(currentRestaurant.slug)
    : getPublicMenuUrl("demo");

  return (
    <div className="air-page">
      <div>
        <h1 className="air-page-title">QR Code Generator</h1>
        <p className="air-page-subtitle">Generate a QR code for your restaurant menu</p>
      </div>

      <div className="air-card air-card-pad">
        <div className="mb-4 flex items-center gap-3">
          <QrCode className="h-5 w-5 text-muted-foreground" />
          <h2 className="air-section-title">Menu QR Code</h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          This QR code links to your restaurant&apos;s public menu page. Print it and place it on
          your tables, menus, or marketing materials.
        </p>

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
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-[10px] border border-input"
                />
                <span className="text-sm text-muted-foreground">{qrColor}</span>
              </div>
            </div>

            <div>
              <label className="air-label">Menu URL</label>
              <div className="rounded-[10px] border border-border bg-muted p-3">
                <code className="break-all text-sm text-slate-700">{restaurantUrl}</code>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted p-4">
              <h3 className="mb-2 text-sm font-medium text-slate-900">How to use</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Print this QR code and place it on your tables</li>
                <li>• Customers scan to view your menu on their phones</li>
                <li>• The QR code has a transparent background</li>
                <li>• Customize the color to match your brand</li>
              </ul>
            </div>

            <Button onClick={downloadQrCode} className="gap-2">
              <Download className="h-4 w-4" />
              Download QR Code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
