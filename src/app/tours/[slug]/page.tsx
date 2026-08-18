import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  MapPin,
  X,
  Clock,
} from "lucide-react";
import { getTourBySlug } from "@/lib/db";
import { BookNowButton } from "@/components/tours/BookNowButton";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const TOUR_TYPE_LABELS: Record<string, string> = {
  GROUP: "Group Tour",
  PRIVATE: "Private Tour",
  CUSTOM: "Custom Tour",
};

export default async function TourDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);

  if (!tour) notFound();

  return (
    <div className="pb-16">
      {/* Hero gallery */}
      <div className="relative h-[50vh] min-h-[320px] bg-stone-900">
        <Image
          src={tour.imageUrl}
          alt={tour.title}
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to catalog
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge bg-brand-500 text-white">
                <Calendar className="mr-1 h-3 w-3" />
                {tour.durationText}
              </span>
              <span className="badge bg-white/20 text-white backdrop-blur">
                <MapPin className="mr-1 h-3 w-3" />
                {tour.destination}
              </span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-white md:text-5xl">
              {tour.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="font-display text-2xl font-bold">Overview</h2>
              <p className="mt-3 leading-relaxed text-stone-600">{tour.summary}</p>
              {tour.overview && (
                <p className="mt-2 leading-relaxed text-stone-500">{tour.overview}</p>
              )}
            </section>

            {tour.highlights.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold">Places Covered</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tour.highlights.map((place) => (
                    <span
                      key={place}
                      className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                    >
                      {place}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {tour.itinerary.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold">Day-by-Day Itinerary</h2>
                <div className="mt-6 space-y-4">
                  {tour.itinerary.map((day) => (
                    <div key={day.day} className="card p-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                          {String(day.day).padStart(2, "0")}
                        </span>
                        <div>
                          <h3 className="font-semibold text-stone-900">
                            Day {day.day}
                          </h3>
                          <p className="text-sm text-brand-600">{day.title}</p>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1.5 pl-13 text-sm text-stone-600">
                        {day.activities.map((act, i) => (
                          <li key={i} className="flex gap-2">
                            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                            {act}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {tour.inclusions.length > 0 && (
                <section className="card p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-green-700">
                    <Check className="h-5 w-5" />
                    Inclusions
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-stone-600">
                    {tour.inclusions.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {tour.exclusions.length > 0 && (
                <section className="card p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-red-700">
                    <X className="h-5 w-5" />
                    Exclusions
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-stone-600">
                    {tour.exclusions.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>

          {/* Sidebar — pricing & CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="card p-6">
                <h2 className="font-display text-xl font-bold">Pricing & Tour Types</h2>
                <div className="mt-4 space-y-3">
                  {tour.pricingTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="rounded-xl border border-stone-100 bg-stone-50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="badge bg-brand-100 text-brand-800">
                          {TOUR_TYPE_LABELS[tier.tourType] ?? tier.tourType}
                        </span>
                        <span className="text-lg font-bold text-brand-700">
                          {formatCurrency(tier.price)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-stone-600">{tier.label}</p>
                      {tier.description && tier.description !== tier.label && (
                        <p className="mt-1 text-xs text-stone-400">{tier.description}</p>
                      )}
                      <div className="mt-3">
                        <BookNowButton
                          tourTitle={tour.title}
                          tourType={TOUR_TYPE_LABELS[tier.tourType]}
                          variant="secondary"
                          label="Inquire"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  <BookNowButton tourTitle={tour.title} variant="accent" />
                  <p className="text-center text-xs text-stone-400">
                    Booking redirects to our official Instagram for confirmation
                  </p>
                </div>
              </div>

              {tour.galleryUrls.length > 1 && (
                <div className="card overflow-hidden p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {tour.galleryUrls.slice(0, 4).map((url, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                        <Image src={url} alt="" fill className="object-cover" sizes="150px" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
