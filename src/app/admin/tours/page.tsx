import Link from "next/link";
import { Plus } from "lucide-react";
import { ToursAdminList } from "@/components/admin/ToursAdminList";

export const dynamic = "force-dynamic";

export default function AdminToursPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">
            Manage Tours
          </h1>
          <p className="text-sm text-stone-500">
            Add, edit, or remove tour packages
          </p>
        </div>
        <Link href="/admin/tours/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4" />
          Add Tour
        </Link>
      </div>
      <ToursAdminList />
    </div>
  );
}
