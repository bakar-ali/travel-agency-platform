"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { linesToArray, arrayToLines } from "@/lib/utils";

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}

export interface PricingTierInput {
  tourType: "GROUP" | "PRIVATE" | "CUSTOM";
  label: string;
  price: number;
  description?: string;
}

export interface TourFormData {
  title: string;
  destination: string;
  duration: number;
  durationText: string;
  summary: string;
  overview: string;
  highlights: string;
  inclusions: string;
  exclusions: string;
  itinerary: ItineraryDay[];
  imageUrl: string;
  galleryUrls: string;
  isActive: boolean;
  pricingTiers: PricingTierInput[];
}

const EMPTY_TIER = (type: PricingTierInput["tourType"], label: string): PricingTierInput => ({
  tourType: type,
  label,
  price: 0,
  description: "",
});

export const defaultTourForm = (): TourFormData => ({
  title: "",
  destination: "",
  duration: 3,
  durationText: "",
  summary: "",
  overview: "",
  highlights: "",
  inclusions: "",
  exclusions: "",
  itinerary: [{ day: 0, title: "Departure", activities: [""] }],
  imageUrl: "",
  galleryUrls: "",
  isActive: true,
  pricingTiers: [
    EMPTY_TIER("GROUP", "Standard Package"),
    EMPTY_TIER("GROUP", "Deluxe Package"),
    EMPTY_TIER("PRIVATE", "Standard Private Tour"),
    EMPTY_TIER("PRIVATE", "Deluxe Private Tour"),
    EMPTY_TIER("CUSTOM", "Custom Itinerary"),
  ],
});

interface TourFormProps {
  initial?: TourFormData;
  tourId?: string;
  submitLabel?: string;
}

export function TourForm({
  initial,
  tourId,
  submitLabel = "Save Tour",
}: TourFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<TourFormData>(initial ?? defaultTourForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof TourFormData>(key: K, value: TourFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItineraryDay(index: number, field: keyof ItineraryDay, value: string | number) {
    setForm((prev) => {
      const itinerary = [...prev.itinerary];
      itinerary[index] = { ...itinerary[index], [field]: value };
      return { ...prev, itinerary };
    });
  }

  function updateItineraryActivities(index: number, text: string) {
    setForm((prev) => {
      const itinerary = [...prev.itinerary];
      itinerary[index] = {
        ...itinerary[index],
        activities: text.split("\n").map((l) => l.trim()).filter(Boolean),
      };
      return { ...prev, itinerary };
    });
  }

  function addItineraryDay() {
    setForm((prev) => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        { day: prev.itinerary.length, title: "", activities: [""] },
      ],
    }));
  }

  function removeItineraryDay(index: number) {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index),
    }));
  }

  function updateTier(index: number, field: keyof PricingTierInput, value: string | number) {
    setForm((prev) => {
      const pricingTiers = [...prev.pricingTiers];
      pricingTiers[index] = { ...pricingTiers[index], [field]: value };
      return { ...prev, pricingTiers };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title: form.title,
      destination: form.destination,
      duration: Number(form.duration),
      durationText: form.durationText || undefined,
      summary: form.summary,
      overview: form.overview || undefined,
      highlights: linesToArray(form.highlights),
      inclusions: linesToArray(form.inclusions),
      exclusions: linesToArray(form.exclusions),
      itinerary: form.itinerary.map((d) => ({
        ...d,
        activities: d.activities.filter(Boolean),
      })),
      imageUrl: form.imageUrl || undefined,
      galleryUrls: linesToArray(form.galleryUrls),
      isActive: form.isActive,
      pricingTiers: form.pricingTiers.filter((t) => t.price > 0),
    };

    const url = tourId ? `/api/admin/tours/${tourId}` : "/api/admin/tours";
    const method = tourId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError("Failed to save tour. Check all required fields.");
      setLoading(false);
      return;
    }

    router.push("/admin/tours");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
  const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <section className="card p-6">
        <h2 className="font-display text-xl font-bold text-stone-900">Basic Information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Tour Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className={inputClass}
              placeholder="5 Days Hunza Valley Group Tour"
            />
          </div>
          <div>
            <label className={labelClass}>Destination *</label>
            <input
              required
              value={form.destination}
              onChange={(e) => updateField("destination", e.target.value)}
              className={inputClass}
              placeholder="Hunza Valley"
            />
          </div>
          <div>
            <label className={labelClass}>Duration (days) *</label>
            <input
              required
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) => updateField("duration", Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Duration Label</label>
            <input
              value={form.durationText}
              onChange={(e) => updateField("durationText", e.target.value)}
              className={inputClass}
              placeholder="5 Days / 4 Nights (auto-generated if empty)"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Summary *</label>
            <textarea
              required
              rows={3}
              value={form.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              className={inputClass}
              placeholder="Short description for tour cards..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Overview</label>
            <textarea
              rows={2}
              value={form.overview}
              onChange={(e) => updateField("overview", e.target.value)}
              className={inputClass}
              placeholder="Extended overview text..."
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-brand-600"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-stone-700">
              Published (visible on public site)
            </label>
          </div>
        </div>
      </section>

      {/* Places & lists */}
      <section className="card p-6">
        <h2 className="font-display text-xl font-bold text-stone-900">Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Places Covered (one per line)</label>
            <textarea
              rows={5}
              value={form.highlights}
              onChange={(e) => updateField("highlights", e.target.value)}
              className={inputClass}
              placeholder={"Attabad Lake\nPassu Cones\nKhunjerab Pass"}
            />
          </div>
          <div>
            <label className={labelClass}>Inclusions (one per line)</label>
            <textarea
              rows={5}
              value={form.inclusions}
              onChange={(e) => updateField("inclusions", e.target.value)}
              className={inputClass}
              placeholder={"Transport\nAccommodation\nBreakfast & Dinner"}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Exclusions (one per line)</label>
            <textarea
              rows={3}
              value={form.exclusions}
              onChange={(e) => updateField("exclusions", e.target.value)}
              className={inputClass}
              placeholder={"Jeep charges\nPersonal expenses"}
            />
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-stone-900">Itinerary</h2>
          <button
            type="button"
            onClick={addItineraryDay}
            className="flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            <Plus className="h-4 w-4" />
            Add Day
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {form.itinerary.map((day, index) => (
            <div key={index} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-700">
                  Day {String(day.day).padStart(2, "0")}
                </span>
                {form.itinerary.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItineraryDay(index)}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Day Number</label>
                  <input
                    type="number"
                    min={0}
                    value={day.day}
                    onChange={(e) =>
                      updateItineraryDay(index, "day", Number(e.target.value))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Day Title</label>
                  <input
                    value={day.title}
                    onChange={(e) => updateItineraryDay(index, "title", e.target.value)}
                    className={inputClass}
                    placeholder="Breakfast in Hunza"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Activities (one per line)</label>
                  <textarea
                    rows={3}
                    value={arrayToLines(day.activities)}
                    onChange={(e) => updateItineraryActivities(index, e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="card p-6">
        <h2 className="font-display text-xl font-bold text-stone-900">Pricing Tiers</h2>
        <div className="mt-4 space-y-4">
          {form.pricingTiers.map((tier, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-stone-100 p-4 sm:grid-cols-4">
              <div>
                <label className={labelClass}>Type</label>
                <select
                  value={tier.tourType}
                  onChange={(e) =>
                    updateTier(index, "tourType", e.target.value as PricingTierInput["tourType"])
                  }
                  className={inputClass}
                >
                  <option value="GROUP">Group Tour</option>
                  <option value="PRIVATE">Private Tour</option>
                  <option value="CUSTOM">Custom Tour</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Label</label>
                <input
                  value={tier.label}
                  onChange={(e) => updateTier(index, "label", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price (PKR)</label>
                <input
                  type="number"
                  min={0}
                  value={tier.price || ""}
                  onChange={(e) => updateTier(index, "price", Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input
                  value={tier.description ?? ""}
                  onChange={(e) => updateTier(index, "description", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Images */}
      <section className="card p-6">
        <h2 className="font-display text-xl font-bold text-stone-900">Images</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label className={labelClass}>Main Image URL</label>
            <input
              value={form.imageUrl}
              onChange={(e) => updateField("imageUrl", e.target.value)}
              className={inputClass}
              placeholder="https://images.unsplash.com/... (auto if empty)"
            />
          </div>
          <div>
            <label className={labelClass}>Gallery URLs (one per line)</label>
            <textarea
              rows={3}
              value={form.galleryUrls}
              onChange={(e) => updateField("galleryUrls", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
