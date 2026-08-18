import { TourForm } from "@/components/admin/TourForm";

export default function NewTourPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Add New Tour</h1>
        <p className="text-sm text-stone-500">
          Fill in all tour details — it will appear on the public site when published
        </p>
      </div>
      <TourForm submitLabel="Create Tour" />
    </div>
  );
}
