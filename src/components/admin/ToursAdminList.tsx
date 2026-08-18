"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AdminTour {
  id: string;
  title: string;
  destination: string;
  duration: number;
  isActive: boolean;
  pricingTiers: { price: number }[];
  _count: { bookings: number };
}

export function ToursAdminList() {
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/tours")
      .then((r) => r.json())
      .then(setTours)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/tours/${id}`, { method: "DELETE" });
    setTours((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return <p className="text-stone-500">Loading tours...</p>;
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-stone-100 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3">Tour</th>
            <th className="px-4 py-3">Destination</th>
            <th className="px-4 py-3">Days</th>
            <th className="px-4 py-3">From</th>
            <th className="px-4 py-3">Bookings</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {tours.map((tour) => {
            const lowest = tour.pricingTiers.length
              ? Math.min(...tour.pricingTiers.map((p) => p.price))
              : null;
            return (
              <tr key={tour.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 font-medium text-stone-900">{tour.title}</td>
                <td className="px-4 py-3 text-stone-600">{tour.destination}</td>
                <td className="px-4 py-3">{tour.duration}</td>
                <td className="px-4 py-3">
                  {lowest ? formatCurrency(lowest) : "—"}
                </td>
                <td className="px-4 py-3">{tour._count.bookings}</td>
                <td className="px-4 py-3">
                  {tour.isActive ? (
                    <span className="badge bg-green-100 text-green-700">
                      <Eye className="mr-1 h-3 w-3" />
                      Live
                    </span>
                  ) : (
                    <span className="badge bg-stone-100 text-stone-500">
                      <EyeOff className="mr-1 h-3 w-3" />
                      Hidden
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/tours/${tour.id}/edit`}
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(tour.id, tour.title)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tours.length === 0 && (
        <p className="p-8 text-center text-stone-500">
          No tours yet.{" "}
          <Link href="/admin/tours/new" className="text-brand-600 hover:underline">
            Add your first tour
          </Link>
        </p>
      )}
    </div>
  );
}
