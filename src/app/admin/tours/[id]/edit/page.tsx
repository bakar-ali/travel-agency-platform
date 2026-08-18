import { notFound } from "next/navigation";
import { TourForm, type TourFormData } from "@/components/admin/TourForm";
import { getTourForAdmin } from "@/lib/admin-tours";
import { parseJsonArray, arrayToLines } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function toFormData(tour: NonNullable<Awaited<ReturnType<typeof getTourForAdmin>>>): TourFormData {
  return {
    title: tour.title,
    destination: tour.destination,
    duration: tour.duration,
    durationText: tour.durationText,
    summary: tour.summary,
    overview: tour.overview ?? "",
    highlights: arrayToLines(parseJsonArray<string>(tour.highlights)),
    inclusions: arrayToLines(parseJsonArray<string>(tour.inclusions)),
    exclusions: arrayToLines(parseJsonArray<string>(tour.exclusions)),
    itinerary: parseJsonArray<{ day: number; title: string; activities: string[] }>(
      tour.itinerary
    ),
    imageUrl: tour.imageUrl,
    galleryUrls: arrayToLines(parseJsonArray<string>(tour.galleryUrls)),
    isActive: tour.isActive,
    pricingTiers: tour.pricingTiers.map((t) => ({
      tourType: t.tourType,
      label: t.label,
      price: t.price,
      description: t.description ?? "",
    })),
  };
}

export default async function EditTourPage({ params }: PageProps) {
  const { id } = await params;
  const tour = await getTourForAdmin(id);
  if (!tour) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Edit Tour</h1>
        <p className="text-sm text-stone-500">{tour.title}</p>
      </div>
      <TourForm initial={toFormData(tour)} tourId={id} submitLabel="Update Tour" />
    </div>
  );
}
