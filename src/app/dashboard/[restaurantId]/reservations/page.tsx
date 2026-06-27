"use client";

import { Calendar } from "lucide-react";

export default function ReservationsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Calendar className="h-8 w-8 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Table Reservations</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          We're building an intelligent booking system to help you manage your floor plan, guest lists, and covers effortlessly. Stay tuned!
        </p>
      </div>
    </div>
  );
}
