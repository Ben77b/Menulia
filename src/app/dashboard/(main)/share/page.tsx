"use client";

import { useState, useEffect } from "react";
import { fetchDemoRestaurant } from "@/lib/data";
import { Download, Share2, Copy, Check, Mail, Twitter, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

export default function SharePage() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const r = await fetchDemoRestaurant();
        setRestaurant(r);
      } catch (error) {
        console.error('Error loading restaurant for share page:', error);
      }
    }
    loadData();
  }, []);

  const publicUrl = restaurant ? `${window.location.origin}/r/${restaurant.slug}` : "";

  function handleCopyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: restaurant?.name || "Restaurant Menu",
        url: publicUrl,
      });
    }
  }

  function handleDownloadQR() {
    const svg = document.querySelector("#qr-code svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      
      img.onload = () => {
        canvas.width = 256;
        canvas.height = 256;
        ctx?.drawImage(img, 0, 0);
        const link = document.createElement("a");
        link.download = `${restaurant?.name || "menu"}-qr-code.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Share Your Menu</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Share your restaurant menu with guests via QR code or direct link
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-8">
        <div className="flex flex-col items-center mb-8">
          <div id="qr-code" className="h-64 w-64 rounded-2xl border-2 border-border bg-white p-4 shadow-lg flex items-center justify-center">
            <QRCode value={publicUrl} size={224} level="H" />
          </div>
          <Button onClick={handleDownloadQR} variant="outline" className="mt-4">
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold mb-3">Direct Link</h3>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={publicUrl}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm bg-muted"
            />
            <Button onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Share via</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Share2 className="h-5 w-5" />
              <span className="text-xs">Share</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`mailto:?subject=Check out ${restaurant?.name}&body=Here's our menu: ${publicUrl}`)}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Mail className="h-5 w-5" />
              <span className="text-xs">Email</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out ${restaurant?.name} menu: ${publicUrl}`)}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Twitter className="h-5 w-5" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`)}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Facebook className="h-5 w-5" />
              <span className="text-xs">Facebook</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-emerald-brand-light/30 p-6">
        <h3 className="font-semibold text-emerald-brand mb-2">Tips for sharing</h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-emerald-brand mt-0.5">•</span>
            Print the QR code and place it on tables for easy access
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-brand mt-0.5">•</span>
            Share the link on your social media profiles
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-brand mt-0.5">•</span>
            Include the QR code in your marketing materials
          </li>
        </ul>
      </div>
    </div>
  );
}
