"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import { formatCurrency, linesToArray } from "@/lib/utils";

interface TourOption {
  id: string;
  title: string;
  destination: string;
  duration: number;
  pricingTiers: { tourType: string; label: string; price: number }[];
}

interface BookingFormModalProps {
  initialDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function BookingFormModal({
  initialDate,
  onClose,
  onSaved,
}: BookingFormModalProps) {
  const [tours, setTours] = useState<TourOption[]>([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [tourId, setTourId] = useState("");
  const [tourType, setTourType] = useState<"GROUP" | "PRIVATE" | "CUSTOM">("GROUP");
  const [startDate, setStartDate] = useState(initialDate ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [participants, setParticipants] = useState(1);
  const [passengerNames, setPassengerNames] = useState("");
  const [totalPrice, setTotalPrice] = useState<number | "">("");
  const [amountPaid, setAmountPaid] = useState<number | "">(0);
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PARTIAL" | "PENDING">("PENDING");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  useEffect(() => {
    setToursLoading(true);
    fetch("/api/admin/tours")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load tours");
        const data = await r.json();
        if (!Array.isArray(data)) throw new Error("Invalid tour data");
        return data as TourOption[];
      })
      .then((data) => {
        setTours(data);
        if (data.length > 0) setTourId(data[0].id);
      })
      .catch(() => setError("Could not load tours. Add tours first or redeploy."))
      .finally(() => setToursLoading(false));
  }, []);

  const selectedTour = useMemo(
    () => tours.find((t) => t.id === tourId),
    [tours, tourId]
  );

  const suggestedPrice = useMemo(() => {
    if (!selectedTour) return 0;
    const tier =
      selectedTour.pricingTiers.find((t) => t.tourType === tourType) ??
      selectedTour.pricingTiers[0];
    if (!tier) return 0;
    return tourType === "GROUP" ? tier.price : tier.price * participants;
  }, [selectedTour, tourType, participants]);

  useEffect(() => {
    setTotalPrice(suggestedPrice);
  }, [suggestedPrice]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tourId,
        tourType,
        startDate,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        participants: Number(participants),
        passengerNames: linesToArray(passengerNames),
        totalPrice: totalPrice === "" ? undefined : Number(totalPrice),
        amountPaid: amountPaid === "" ? 0 : Number(amountPaid),
        paymentStatus,
        paymentNotes: paymentNotes || undefined,
        specialRequests: specialRequests || undefined,
      }),
    });

    if (!res.ok) {
      setError("Failed to save booking. Check all required fields.");
      setLoading(false);
      return;
    }

    onSaved();
    onClose();
  }

  const inputClass =
    "w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
  const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-stone-100 bg-white px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900">New Booking</h2>
            <p className="text-sm text-stone-500">Log a tour departure and customer details</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Tour & dates */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Tour *</label>
              <select
                required
                value={tourId}
                onChange={(e) => setTourId(e.target.value)}
                className={inputClass}
                disabled={toursLoading || tours.length === 0}
              >
                {toursLoading ? (
                  <option value="">Loading tours...</option>
                ) : tours.length === 0 ? (
                  <option value="">No tours available — add a tour first</option>
                ) : (
                  tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.duration} days)
                    </option>
                  ))
                )}
              </select>
              {!toursLoading && tours.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Go to Admin → Tours → Add Tour, or ensure the database is seeded.
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Tour Type *</label>
              <select
                value={tourType}
                onChange={(e) =>
                  setTourType(e.target.value as "GROUP" | "PRIVATE" | "CUSTOM")
                }
                className={inputClass}
              >
                <option value="GROUP">Group Tour</option>
                <option value="PRIVATE">Private Tour</option>
                <option value="CUSTOM">Custom Tour</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Departure Date *</label>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            {selectedTour && startDate && (
              <p className="sm:col-span-2 text-sm text-stone-500">
                Returns approx.{" "}
                {new Date(
                  new Date(startDate).getTime() +
                    selectedTour.duration * 24 * 60 * 60 * 1000
                ).toLocaleDateString("en-PK")}
                {" "}({selectedTour.duration} days)
              </p>
            )}
          </section>

          {/* Customer */}
          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
              Customer
            </h3>
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={inputClass}
                placeholder="Ali Ahmed"
              />
            </div>
            <div>
              <label className={labelClass}>Phone *</label>
              <input
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={inputClass}
                placeholder="0300-1234567"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className={inputClass}
                placeholder="optional"
              />
            </div>
          </section>

          {/* Passengers */}
          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
              Passengers
            </h3>
            <div>
              <label className={labelClass}>Number of People *</label>
              <input
                required
                type="number"
                min={1}
                value={participants}
                onChange={(e) => setParticipants(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Passenger Names (one per line)</label>
              <textarea
                rows={4}
                value={passengerNames}
                onChange={(e) => setPassengerNames(e.target.value)}
                className={inputClass}
                placeholder={"Ali Ahmed\nSara Ahmed\n..."}
              />
              <p className="mt-1 text-xs text-stone-400">
                First name is usually the lead customer. Leave blank to auto-fill.
              </p>
            </div>
          </section>

          {/* Payment */}
          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
              Payment
            </h3>
            <div>
              <label className={labelClass}>
                Total Price (PKR)
                {suggestedPrice > 0 && (
                  <span className="ml-2 font-normal text-stone-400">
                    Suggested: {formatCurrency(suggestedPrice)}
                  </span>
                )}
              </label>
              <input
                type="number"
                min={0}
                value={totalPrice}
                onChange={(e) =>
                  setTotalPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Amount Paid (PKR)</label>
              <input
                type="number"
                min={0}
                value={amountPaid}
                onChange={(e) =>
                  setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as "PAID" | "PARTIAL" | "PENDING")
                }
                className={inputClass}
              >
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial / Deposit</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Payment Notes</label>
              <input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className={inputClass}
                placeholder="Bank transfer ref, deposit details..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Special Requests</label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className={inputClass}
                placeholder="Dietary needs, room preferences..."
              />
            </div>
          </section>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 border-t border-stone-100 pt-4">
            <button type="submit" disabled={loading || toursLoading || tours.length === 0} className="btn-primary">
              <Plus className="h-4 w-4" />
              {loading ? "Saving..." : "Create Booking"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
