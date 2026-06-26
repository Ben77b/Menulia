"use client";

import { useState, useEffect, useRef } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";
import QRCode from "react-qr-code";

export default function QrCodePage() {
  const { currentRestaurant } = useRestaurant();
  const [qrColor, setQrColor] = useState("#000000");
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);

  // Safety timeout to force loading to false after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Forcing QR page loading to false due to timeout');
        setLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (currentRestaurant) {
      setLoading(false);
    }
  }, [currentRestaurant]);

  function downloadQrCode() {
    if (!qrRef.current) return;

    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `qr-code-${currentRestaurant?.slug || 'restaurant'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }

  if (loading) return <div>Loading...</div>;
  if (!currentRestaurant) return <div>Loading...</div>;

  const restaurantUrl = `https://menulia.net/${currentRestaurant.slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Code Generator</h1>
        <p className="mt-1 text-sm text-gray-600">Generate a QR code for your restaurant menu</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <QrCode className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Menu QR Code</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          This QR code links to your restaurant's public menu page.
          Print it and place it on your tables, menus, or marketing materials.
        </p>

        <div className="flex items-start gap-8">
          <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={qrColor}
                  onChange={(e) => setQrColor(e.target.value)}
                  className="h-10 w-16 rounded border border-gray-200 cursor-pointer"
                />
                <span className="text-sm text-gray-600">{qrColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu URL
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <code className="text-sm text-gray-700 break-all">{restaurantUrl}</code>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
              <h3 className="text-sm font-medium text-indigo-900 mb-2">How to use</h3>
              <ul className="text-xs text-indigo-700 space-y-1">
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
