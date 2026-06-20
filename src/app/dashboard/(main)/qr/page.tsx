"use client";

import { useState, useEffect } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";

export default function QrCodePage() {
  const { currentRestaurant } = useRestaurant();
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentRestaurant) {
      generateQrCode();
      setLoading(false);
    }
  }, [currentRestaurant]);

  function generateQrCode() {
    if (!currentRestaurant) return;
    const baseUrl = window.location.origin;
    const restaurantUrl = `${baseUrl}/${currentRestaurant.slug}?table=true`;
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(restaurantUrl)}`);
  }

  function downloadQrCode() {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${currentRestaurant?.slug || 'restaurant'}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) return <div>Loading...</div>;
  if (!currentRestaurant) return <div>Loading...</div>;

  const restaurantUrl = `${window.location.origin}/${currentRestaurant.slug}?table=true`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Code Generator</h1>
        <p className="mt-1 text-sm text-gray-600">Generate a QR code for your in-house menu</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <QrCode className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">In-House Menu QR Code</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          This QR code links to your restaurant's menu with the in-house layout view. 
          The <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">?table=true</code> parameter 
          hides reservation features for patrons who are already seated at a table.
        </p>
        
        <div className="flex items-start gap-8">
          <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            )}
          </div>
          <div className="flex-1 space-y-4">
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
                <li>• The in-house view hides reservation buttons</li>
                <li>• Perfect for dine-in customers</li>
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
