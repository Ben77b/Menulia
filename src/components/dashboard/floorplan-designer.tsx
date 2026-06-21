"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Move, Square, Circle, Table, Save, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Table {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seats: number;
  type: "rect" | "circle";
  rotation: number;
}

interface FloorplanDesignerProps {
  restaurantId: string;
}

export function FloorplanDesigner({ restaurantId }: FloorplanDesignerProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved floorplan from localStorage
    const saved = localStorage.getItem(`floorplan-tables-${restaurantId}`);
    if (saved) {
      try {
        setTables(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load floorplan:", e);
      }
    }
  }, [restaurantId]);

  function handleSave() {
    localStorage.setItem(`floorplan-tables-${restaurantId}`, JSON.stringify(tables));
    alert("Floorplan saved!");
  }

  function addTable(type: "rect" | "circle") {
    const newTable: Table = {
      id: `table-${Date.now()}`,
      x: 200,
      y: 200,
      width: type === "rect" ? 100 : 80,
      height: type === "rect" ? 60 : 80,
      seats: 4,
      type,
      rotation: 0,
    };
    setTables([...tables, newTable]);
    setSelectedTable(newTable.id);
  }

  function deleteTable(id: string) {
    setTables(tables.filter((t) => t.id !== id));
    if (selectedTable === id) setSelectedTable(null);
  }

  function updateTable(id: string, updates: Partial<Table>) {
    setTables(tables.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  function handleMouseDown(e: React.MouseEvent, table: Table) {
    if (e.button !== 0) return;
    setSelectedTable(table.id);
    setIsDragging(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - table.x,
        y: e.clientY - rect.top - table.y,
      });
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || !selectedTable) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const table = tables.find((t) => t.id === selectedTable);
      if (table) {
        updateTable(selectedTable, {
          x: Math.max(0, e.clientX - rect.left - dragOffset.x),
          y: Math.max(0, e.clientY - rect.top - dragOffset.y),
        });
      }
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  const selectedTableData = tables.find((t) => t.id === selectedTable);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Restaurant Floorplan</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Design your restaurant layout with tables for reservations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1">
          <div
            ref={canvasRef}
            className="relative h-[600px] w-full overflow-hidden rounded-2xl border-2 border-border bg-muted/30"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {tables.map((table) => (
              <div
                key={table.id}
                onMouseDown={(e) => handleMouseDown(e, table)}
                className={cn(
                  "absolute cursor-move transition-shadow",
                  selectedTable === table.id && "ring-2 ring-emerald-brand ring-offset-2"
                )}
                style={{
                  left: table.x,
                  top: table.y,
                  width: table.width,
                  height: table.height,
                  borderRadius: table.type === "circle" ? "50%" : "8px",
                  backgroundColor: selectedTable === table.id ? "#d1fae5" : "#f3f4f6",
                  border: `2px solid ${selectedTable === table.id ? "#047857" : "#d1d5db"}`,
                  transform: `rotate(${table.rotation}deg)`,
                }}
              >
                <div className="flex h-full items-center justify-center">
                  <Table className="h-6 w-6 text-text-secondary" />
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-white px-2 py-0.5 text-xs font-medium shadow">
                  {table.seats} seats
                </div>
              </div>
            ))}

            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Table className="mx-auto h-12 w-12 text-text-secondary" />
                  <p className="mt-2 text-sm text-text-secondary">
                    No tables added yet
                  </p>
                  <p className="text-xs text-text-secondary">
                    Click "Add Table" to start designing
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 space-y-4">
          <div className="rounded-2xl border border-border bg-white p-4">
            <h3 className="font-semibold mb-3">Add Tables</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => addTable("rect")}
                className="w-full"
              >
                <Square className="h-4 w-4 mr-2" />
                Rectangular Table
              </Button>
              <Button
                variant="outline"
                onClick={() => addTable("circle")}
                className="w-full"
              >
                <Circle className="h-4 w-4 mr-2" />
                Round Table
              </Button>
            </div>
          </div>

          {selectedTableData && (
            <div className="rounded-2xl border border-border bg-white p-4">
              <h3 className="font-semibold mb-3">Table Properties</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-text-secondary">Seats</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={selectedTableData.seats}
                    onChange={(e) =>
                      selectedTable && updateTable(selectedTable, {
                        seats: parseInt(e.target.value) || 1,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary">Width (px)</label>
                  <input
                    type="number"
                    min="40"
                    max="300"
                    value={selectedTableData.width}
                    onChange={(e) =>
                      selectedTable && updateTable(selectedTable, {
                        width: parseInt(e.target.value) || 80,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary">Height (px)</label>
                  <input
                    type="number"
                    min="40"
                    max="300"
                    value={selectedTableData.height}
                    onChange={(e) =>
                      selectedTable && updateTable(selectedTable, {
                        height: parseInt(e.target.value) || 80,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary">Rotation (°)</label>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    value={selectedTableData.rotation}
                    onChange={(e) =>
                      selectedTable && updateTable(selectedTable, {
                        rotation: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => selectedTable && deleteTable(selectedTable)}
                  className="w-full text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Table
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-white p-4">
            <h3 className="font-semibold mb-3">Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setTables([])}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
