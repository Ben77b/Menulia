"use client";

import { useState, useCallback } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParsedItem {
  id: string;
  name: string;
  price: number;
  description: string;
  confirmed: boolean;
}

const MOCK_PARSED: Omit<ParsedItem, "id" | "confirmed">[] = [
  { name: "Grilled Sea Bass", price: 24.5, description: "Herb butter, seasonal vegetables" },
  { name: "Beef Tartare", price: 18.0, description: "Capers, shallot, quail egg" },
  { name: "Burrata Salad", price: 14.0, description: "Heirloom tomatoes, basil oil" },
  { name: "Tiramisu", price: 9.5, description: "Espresso-soaked ladyfingers, mascarpone" },
];

export function MenuImporter() {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [items, setItems] = useState<ParsedItem[]>([]);

  const processFile = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      setItems(
        MOCK_PARSED.map((item, i) => ({
          ...item,
          id: `parsed-${i}`,
          confirmed: false,
        }))
      );
      setProcessing(false);
    }, 2000);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    processFile();
  }

  function toggleConfirm(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, confirmed: !item.confirmed } : item
      )
    );
  }

  function updateItem(id: string, field: keyof ParsedItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  const confirmedCount = items.filter((i) => i.confirmed).length;

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-colors ${
          dragging ? "border-emerald-brand bg-emerald-brand-light" : "border-border bg-white"
        }`}
      >
        {processing ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-emerald-brand" />
            <p className="mt-4 text-sm font-medium">Analyzing menu layout…</p>
            <p className="mt-1 text-xs text-text-secondary">
              Reading structure, extracting items and prices
            </p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-text-secondary" />
            <p className="mt-4 text-sm font-medium">Drag & drop your paper menu photo</p>
            <p className="mt-1 text-xs text-text-secondary">PNG, JPG up to 10MB</p>
            <Button className="mt-4" onClick={processFile}>
              Or browse files
            </Button>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-6 py-4">
            <h3 className="font-semibold">Staging — Review before saving</h3>
            <p className="text-sm text-text-secondary">
              {confirmedCount} of {items.length} items confirmed
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-secondary">
                  <th className="px-6 py-3 font-medium">Item Name</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Confirm</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3">
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, "name", e.target.value)}
                        className="w-full rounded-lg border border-border px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        step="0.5"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value))}
                        className="w-20 rounded-lg border border-border px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="w-full rounded-lg border border-border px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => toggleConfirm(item.id)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          item.confirmed
                            ? "bg-emerald-brand text-white"
                            : "border border-border"
                        }`}
                      >
                        {item.confirmed && <Check className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-6 py-4">
            <Button disabled={confirmedCount === 0}>
              Save {confirmedCount} item{confirmedCount !== 1 ? "s" : ""} to menu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
