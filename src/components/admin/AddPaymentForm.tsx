"use client";

import { useState } from "react";
import { Plus, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SerializedBooking } from "@/components/dashboard/CalendarDashboard";

interface AddPaymentFormProps {
  booking: Pick<SerializedBooking, "id" | "totalPrice" | "amountPaid" | "formattedTotal" | "formattedPaid">;
  onPaymentAdded: (booking: SerializedBooking) => void;
  compact?: boolean;
}

export function AddPaymentForm({
  booking,
  onPaymentAdded,
  compact = false,
}: AddPaymentFormProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const balance = booking.totalPrice - booking.amountPaid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount === "" || amount <= 0) {
      setError("Enter a valid payment amount");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/bookings/${booking.id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), note: note || undefined }),
    });

    if (!res.ok) {
      setError("Failed to record payment");
      setLoading(false);
      return;
    }

    const updated = (await res.json()) as SerializedBooking;
    setAmount("");
    setNote("");
    setLoading(false);
    onPaymentAdded(updated);
  }

  const inputClass =
    "w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

  if (balance <= 0 && booking.amountPaid >= booking.totalPrice) {
    return (
      <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
        Fully paid — no balance remaining.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">Balance due</span>
          <span className="font-bold text-amber-700">{formatCurrency(balance)}</span>
        </div>
      )}

      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            Payment Amount (PKR) *
          </label>
          <input
            required
            type="number"
            min={1}
            max={balance > 0 ? balance : undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputClass}
            placeholder={balance > 0 ? String(balance) : "0"}
          />
          {balance > 0 && (
            <button
              type="button"
              onClick={() => setAmount(balance)}
              className="mt-1 text-xs text-brand-600 hover:underline"
            >
              Pay full balance ({formatCurrency(balance)})
            </button>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            Payment Note
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="Bank transfer, cash, JazzCash..."
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary text-sm">
        <Banknote className="h-4 w-4" />
        {loading ? "Saving..." : "Record Payment"}
      </button>
    </form>
  );
}

interface BookingCreatedStepProps {
  booking: SerializedBooking;
  onDone: () => void;
  onPaymentAdded: (booking: SerializedBooking) => void;
}

export function BookingCreatedStep({
  booking,
  onDone,
  onPaymentAdded,
}: BookingCreatedStepProps) {
  const [current, setCurrent] = useState(booking);

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-xl bg-green-50 px-4 py-4 text-center">
        <p className="font-display text-lg font-bold text-green-800">Booking Created</p>
        <p className="mt-1 text-sm text-green-700">
          {current.bookingRef} — {current.tour.title}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Total: {current.formattedTotal} · Paid: {current.formattedPaid}
        </p>
      </div>

      <section className="rounded-xl border border-stone-100 bg-stone-50 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
          <Plus className="h-4 w-4" />
          Add Payment
        </h3>
        <AddPaymentForm
          booking={current}
          compact
          onPaymentAdded={(updated) => {
            setCurrent(updated);
            onPaymentAdded(updated);
          }}
        />
      </section>

      <button onClick={onDone} className="btn-secondary w-full">
        Done
      </button>
    </div>
  );
}
