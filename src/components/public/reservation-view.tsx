"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import type { OperatingHour } from "@/lib/types";
import { generateTimeSlots } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ReservationViewProps {
  restaurantName: string;
  operatingHours: OperatingHour[];
}

type Step = "date" | "time" | "details" | "done";

export function ReservationView({ restaurantName, operatingHours }: ReservationViewProps) {
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [form, setForm] = useState({ name: "", email: "", phone: "", requests: "" });

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));
  const timeSlots = selectedDate ? generateTimeSlots(operatingHours, selectedDate) : [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-brand" />
        <h2 className="mt-4 text-xl font-semibold">Reservation requested!</h2>
        <p className="mt-2 text-sm text-text-secondary">
          {restaurantName} will confirm your table for{" "}
          {selectedDate && format(selectedDate, "MMM d")} at {selectedTime}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md w-full px-4 pb-28">
      {/* Step indicator */}
      <div className="mb-6 flex justify-center gap-2">
        {(["date", "time", "details"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 w-12 rounded-full ${
              (["date", "time", "details"].indexOf(step) >= i)
                ? "bg-emerald-brand"
                : "bg-border"
            }`}
          />
        ))}
      </div>

      {step === "date" && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Choose a date</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {dates.map((d) => {
              const slots = generateTimeSlots(operatingHours, d);
              const disabled = slots.length === 0;
              return (
                <button
                  key={d.toISOString()}
                  disabled={disabled}
                  onClick={() => { setSelectedDate(d); setStep("time"); }}
                  className="rounded-xl border border-border bg-white p-3 text-center transition-colors hover:border-emerald-brand disabled:opacity-40"
                >
                  <p className="text-xs text-text-secondary">{format(d, "EEE")}</p>
                  <p className="text-lg font-semibold">{format(d, "d")}</p>
                  <p className="text-xs text-text-secondary">{format(d, "MMM")}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "time" && selectedDate && (
        <div>
          <button onClick={() => setStep("date")} className="mb-4 text-sm text-emerald-brand">
            ← Back
          </button>
          <h2 className="mb-4 text-lg font-semibold">
            Pick a time — {format(selectedDate, "EEEE, MMM d")}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => { setSelectedTime(slot); setStep("details"); }}
                className="rounded-xl border border-border bg-white py-3 text-sm font-medium hover:border-emerald-brand"
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "details" && (
        <form onSubmit={handleSubmit}>
          <button type="button" onClick={() => setStep("time")} className="mb-4 text-sm text-emerald-brand">
            ← Back
          </button>
          <h2 className="mb-4 text-lg font-semibold">Your details</h2>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Party size</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-lg"
              >
                −
              </button>
              <span className="text-xl font-semibold">{partySize}</span>
              <button
                type="button"
                onClick={() => setPartySize(Math.min(12, partySize + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-lg"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-emerald-brand"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-emerald-brand"
            />
            <input
              required
              type="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-emerald-brand"
            />
            <textarea
              placeholder="Special requests (optional)"
              value={form.requests}
              onChange={(e) => setForm({ ...form, requests: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-emerald-brand"
            />
          </div>

          <Button type="submit" className="mt-6 w-full" size="lg">
            Request reservation
          </Button>
        </form>
      )}
    </div>
  );
}
