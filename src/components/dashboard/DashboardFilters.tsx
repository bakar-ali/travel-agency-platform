"use client";

import { Search, X } from "lucide-react";

interface Filters {
  tourType: string;
  paymentStatus: string;
  destination: string;
  search: string;
}

interface DashboardFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function DashboardFilters({ filters, onChange }: DashboardFiltersProps) {
  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    onChange({ tourType: "", paymentStatus: "", destination: "", search: "" });
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name or booking ID..."
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            className="w-full rounded-xl border border-stone-200 py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <select
          value={filters.tourType}
          onChange={(e) => update("tourType", e.target.value)}
          className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Tour Types</option>
          <option value="GROUP">Group Tour</option>
          <option value="PRIVATE">Private Tour</option>
          <option value="CUSTOM">Custom Tour</option>
        </select>

        <select
          value={filters.paymentStatus}
          onChange={(e) => update("paymentStatus", e.target.value)}
          className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Payment Status</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial / Deposit</option>
          <option value="PENDING">Pending</option>
        </select>

        <input
          type="text"
          placeholder="Filter destination..."
          value={filters.destination}
          onChange={(e) => update("destination", e.target.value)}
          className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
        />

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm text-stone-500 hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
