"use client";

import { useState } from "react";
import { X, User, Phone, Mail, CreditCard, MapPin, Users, Calendar, Trash2 } from "lucide-react";
import type { SerializedBooking } from "./CalendarDashboard";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AddPaymentForm } from "@/components/admin/AddPaymentForm";

interface BookingModalProps {
  booking: SerializedBooking;
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

const TOUR_TYPE_LABELS: Record<string, string> = {
  GROUP: "Group Tour",
  PRIVATE: "Private Tour",
  CUSTOM: "Custom Tour",
};

function packageFromNotes(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/^Package: (.+?)(?:\n|$)/);
  return match ? match[1] : null;
}

const PAYMENT_LABELS: Record<string, { label: string; className: string }> = {
  PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
  PARTIAL: { label: "Partial / Deposit", className: "bg-amber-100 text-amber-800" },
  PENDING: { label: "Pending", className: "bg-red-100 text-red-800" },
};

export function BookingModal({ booking, onClose, onDeleted, onUpdated }: BookingModalProps) {
  const [current, setCurrent] = useState(booking);
  const payment = PAYMENT_LABELS[current.paymentStatus] ?? PAYMENT_LABELS.PENDING;
  const packageName = packageFromNotes(current.specialRequests);
  const balance = current.totalPrice - current.amountPaid;

  async function handleDelete() {
    if (!confirm(`Delete booking ${current.bookingRef} for ${current.customer.name}?`)) {
      return;
    }
    await fetch(`/api/bookings/${current.id}`, { method: "DELETE" });
    onDeleted?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-stone-100 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-medium text-brand-600">{current.bookingRef}</p>
            <h2 className="font-display text-xl font-bold">{current.tour.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Tour info */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
              Tour Information
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-500" />
                {current.tour.destination}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-500" />
                {formatDate(current.startDate)} — {formatDate(current.endDate)}
              </p>
              <span className="badge bg-brand-100 text-brand-800">
                {TOUR_TYPE_LABELS[current.tourType] ?? current.tourType}
              </span>
              {packageName && (
                <span className="badge ml-2 bg-amber-100 text-amber-800">
                  {packageName}
                </span>
              )}
            </div>
          </section>

          {/* Customer */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
              Customer
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <User className="h-4 w-4 text-stone-400" />
                {current.customer.name}
              </p>
              <p className="flex items-center gap-2 text-stone-600">
                <Phone className="h-4 w-4 text-stone-400" />
                {current.customer.phone}
              </p>
              {current.customer.email && (
                <p className="flex items-center gap-2 text-stone-600">
                  <Mail className="h-4 w-4 text-stone-400" />
                  {current.customer.email}
                </p>
              )}
              <p className="flex items-center gap-2 text-stone-600">
                <Users className="h-4 w-4 text-stone-400" />
                {current.participants} participant{current.participants !== 1 ? "s" : ""}
              </p>
            </div>
          </section>

          {/* Passengers */}
          {current.passengerList.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
                Passenger List
              </h3>
              <ul className="mt-3 space-y-1.5">
                {current.passengerList.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm"
                  >
                    <span>{p.name}</span>
                    {p.cnic && (
                      <span className="text-xs text-stone-400">{p.cnic}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Financial */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
              Financial Status
            </h3>
            <div className="mt-3 rounded-xl bg-stone-50 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-stone-600">
                  <CreditCard className="h-4 w-4" />
                  Total
                </span>
                <span className="font-bold">{current.formattedTotal}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-stone-500">Amount Paid</span>
                <span className="font-semibold text-green-700">{current.formattedPaid}</span>
              </div>
              {balance > 0 && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-stone-500">Balance Due</span>
                  <span className="font-semibold text-amber-700">{formatCurrency(balance)}</span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className={`badge ${payment.className}`}>{payment.label}</span>
                <span className="text-xs text-stone-400">
                  Due: {balance > 0 ? formatCurrency(balance) : "None"}
                </span>
              </div>
              {current.paymentNotes && (
                <div className="mt-3 rounded-lg bg-white p-3 text-xs text-stone-500">
                  <p className="mb-1 font-medium text-stone-600">Payment History</p>
                  <pre className="whitespace-pre-wrap font-sans">{current.paymentNotes}</pre>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-700">
              Add Payment
            </h3>
            <AddPaymentForm
              booking={current}
              onPaymentAdded={(updated) => {
                setCurrent(updated);
                onUpdated?.();
              }}
            />
          </section>

          <div className="border-t border-stone-100 pt-4">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
