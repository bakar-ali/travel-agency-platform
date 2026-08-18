import { CalendarDashboard } from "@/components/dashboard/CalendarDashboard";
import { LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 md:text-3xl">
            Operations Dashboard
          </h1>
          <p className="text-sm text-stone-500">
            Calendar tracking system — view, filter, and manage tour bookings
          </p>
        </div>
      </div>
      <CalendarDashboard />
    </div>
  );
}
