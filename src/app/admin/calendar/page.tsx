import { CalendarDashboard } from "@/components/dashboard/CalendarDashboard";

export const dynamic = "force-dynamic";

export default function AdminCalendarPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">
          Booking Calendar
        </h1>
        <p className="text-sm text-stone-500">
          Log bookings and see who is travelling on which dates. Click a date or use New Booking.
        </p>
      </div>
      <CalendarDashboard />
    </div>
  );
}
