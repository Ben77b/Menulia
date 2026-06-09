"use client";

import { useState } from "react";
import type { Reservation, ReservationStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-brand-light text-emerald-brand",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

interface ReservationsTableProps {
  initialReservations: Reservation[];
}

export function ReservationsTable({ initialReservations }: ReservationsTableProps) {
  const [reservations, setReservations] = useState(initialReservations);

  function updateStatus(id: string, status: ReservationStatus) {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-text-secondary">
            <th className="px-6 py-3 font-medium">Guest</th>
            <th className="px-6 py-3 font-medium">Date & Time</th>
            <th className="px-6 py-3 font-medium">Party</th>
            <th className="px-6 py-3 font-medium">Status</th>
            <th className="px-6 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((res) => (
            <tr key={res.id} className="border-b border-border last:border-0">
              <td className="px-6 py-4">
                <p className="font-medium">{res.customer_name}</p>
                <p className="text-xs text-text-secondary">{res.customer_email}</p>
                {res.special_requests && (
                  <p className="mt-1 text-xs italic text-text-secondary">
                    &ldquo;{res.special_requests}&rdquo;
                  </p>
                )}
              </td>
              <td className="px-6 py-4">
                {format(parseISO(res.date), "MMM d, yyyy")}
                <br />
                <span className="text-text-secondary">{res.time.slice(0, 5)}</span>
              </td>
              <td className="px-6 py-4">{res.party_size}</td>
              <td className="px-6 py-4">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_COLORS[res.status]}`}>
                  {res.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  {res.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(res.id, "confirmed")}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateStatus(res.id, "cancelled")}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {res.status === "confirmed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(res.id, "completed")}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
