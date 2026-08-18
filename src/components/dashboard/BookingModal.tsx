"use client";

import { X, User, Phone, Mail, CreditCard, MapPin, Users, Calendar } from "lucide-react";
import type { SerializedBooking } from "./CalendarDashboard";
import { formatDate } from "@/lib/utils";

interface BookingModalProps {
  booking: SerializedBooking;
  onClose: () => void;
}

const TOUR_TYPE_LABELS: Record<string, string> = {
  GROUP: "Group Tour",
  PRIVATE: "Private Tour",
  CUSTOM: "Custom Tour",
};

const PAYMENT_LABELS: Record<string, { label: string; className: string }> = {
  PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
  PARTIAL: { label: "Partial / Deposit", className: "bg-amber-100 text-amber-800" },
  PENDING: { label: "Pending", className: "bg-red-100 text-red-800" },
};

export function BookingModal({ booking, onClose }: BookingModalProps) {
  const payment = PAYMENT_LABELS[booking.paymentStatus] ?? PAYMENT_LABELS.PENDING;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-stone-100 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-medium text-brand-600">{booking.bookingRef}</p>
            <h2 className="font-display text-xl font-bold">{booking.tour.title}</h2>
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
                {booking.tour.destination}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-500" />
                {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
              </p>
              <span className="badge bg-brand-100 text-brand-800">
                {TOUR_TYPE_LABELS[booking.tourType] ?? booking.tourType}
              </span>
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
                {booking.customer.name}
              </p>
              <p className="flex items-center gap-2 text-stone-600">
                <Phone className="h-4 w-4 text-stone-400" />
                {booking.customer.phone}
              </p>
              {booking.customer.email && (
                <p className="flex items-center gap-2 text-stone-600">
                  <Mail className="h-4 w-4 text-stone-400" />
                  {booking.customer.email}
                </p>
              )}
              <p className="flex items-center gap-2 text-stone-600">
                <Users className="h-4 w-4 text-stone-400" />
                {booking.participants} participant{booking.participants !== 1 ? "s" : ""}
              </p>
            </div>
          </section>

          {/* Passengers */}
          {booking.passengerList.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
                Passenger List
              </h3>
              <ul className="mt-3 space-y-1.5">
                {booking.passengerList.map((p, i) => (
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
                <span className="font-bold">{booking.formattedTotal}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-stone-500">Amount Paid</span>
                <span className="font-semibold text-green-700">{booking.formattedPaid}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`badge ${payment.className}`}>{payment.label}</span>
                <span className="text-xs text-stone-400">
                  Due: {booking.formattedTotal !== booking.formattedPaid ? "Yes" : "None"}
                </span>
              </div>
              {booking.paymentNotes && (
                <p className="mt-3 text-xs italic text-stone-500">{booking.paymentNotes}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
