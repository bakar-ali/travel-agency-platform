"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import { BookingModal } from "./BookingModal";
import { DashboardFilters } from "./DashboardFilters";
import { BookingFormModal } from "@/components/admin/BookingFormModal";
import { CalendarDays, Users, CreditCard, MapPin, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface SerializedBooking {
  id: string;
  bookingRef: string;
  tourType: string;
  startDate: string;
  endDate: string;
  participants: number;
  passengerList: { name: string; cnic?: string }[];
  totalPrice: number;
  amountPaid: number;
  paymentStatus: string;
  paymentNotes: string | null;
  specialRequests: string | null;
  formattedTotal: string;
  formattedPaid: string;
  tour: {
    id: string;
    title: string;
    destination: string;
    duration: number;
  };
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  };
}

const PAYMENT_COLORS: Record<string, string> = {
  PAID: "#16a34a",
  PARTIAL: "#f59e0b",
  PENDING: "#ef4444",
};

const TYPE_COLORS: Record<string, string> = {
  GROUP: "#0284c7",
  PRIVATE: "#7c3aed",
  CUSTOM: "#db2777",
};

export function CalendarDashboard() {
  const [bookings, setBookings] = useState<SerializedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SerializedBooking | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDate, setCreateDate] = useState<string>("");
  const [filters, setFilters] = useState({
    tourType: "",
    paymentStatus: "",
    destination: "",
    search: "",
  });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.tourType) params.set("tourType", filters.tourType);
    if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
    if (filters.destination) params.set("destination", filters.destination);
    if (filters.search) params.set("search", filters.search);

    const res = await fetch(`/api/bookings?${params}`);
    const data = await res.json();
    setBookings(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const events = useMemo(
    () =>
      bookings.map((b) => ({
        id: b.id,
        title: `${b.tour.destination} — ${b.customer.name}`,
        start: b.startDate,
        end: b.endDate,
        backgroundColor: PAYMENT_COLORS[b.paymentStatus] ?? TYPE_COLORS[b.tourType],
        borderColor: TYPE_COLORS[b.tourType],
        extendedProps: { booking: b },
      })),
    [bookings]
  );

  const stats = useMemo(() => {
    const paid = bookings.filter((b) => b.paymentStatus === "PAID").length;
    const pending = bookings.filter((b) => b.paymentStatus === "PENDING").length;
    const revenue = bookings.reduce((s, b) => s + b.amountPaid, 0);
    const pax = bookings.reduce((s, b) => s + b.participants, 0);
    return { total: bookings.length, paid, pending, revenue, pax };
  }, [bookings]);

  const handleEventClick = (info: EventClickArg) => {
    setSelected(info.event.extendedProps.booking as SerializedBooking);
  };

  const handleDateClick = (info: DateClickArg) => {
    setCreateDate(info.dateStr);
    setShowCreate(true);
  };

  const openCreateModal = () => {
    setCreateDate(new Date().toISOString().slice(0, 10));
    setShowCreate(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={openCreateModal} className="btn-primary text-sm">
          <Plus className="h-4 w-4" />
          New Booking
        </button>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { icon: CalendarDays, label: "Bookings", value: stats.total },
          { icon: CreditCard, label: "Paid", value: stats.paid },
          { icon: CreditCard, label: "Pending", value: stats.pending },
          { icon: Users, label: "Total Pax", value: stats.pax },
          { icon: MapPin, label: "Revenue", value: formatCurrency(stats.revenue) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-stone-500">{label}</p>
                <p className="text-lg font-bold text-stone-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DashboardFilters filters={filters} onChange={setFilters} />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="font-medium text-stone-500">Payment:</span>
        {Object.entries(PAYMENT_COLORS).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
            {k}
          </span>
        ))}
        <span className="ml-4 font-medium text-stone-500">Click a date to add a booking</span>
      </div>

      <div className="card overflow-hidden p-4">
        {loading ? (
          <div className="flex h-96 items-center justify-center text-stone-400">
            Loading calendar...
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
            nowIndicator
            editable={false}
            selectable
          />
        )}
      </div>

      {selected && (
        <BookingModal
          booking={selected}
          onClose={() => setSelected(null)}
          onDeleted={fetchBookings}
        />
      )}

      {showCreate && (
        <BookingFormModal
          initialDate={createDate}
          onClose={() => setShowCreate(false)}
          onSaved={fetchBookings}
        />
      )}
    </div>
  );
}
