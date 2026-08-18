import { getAllTours } from "@/lib/db";
import { TourCard } from "@/components/tours/TourCard";
import { Compass, Shield, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tours = await getAllTours();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-400 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-accent-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <span className="badge bg-white/10 text-brand-100 backdrop-blur">
              Gov. License #0303371
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Explore Pakistan&apos;s Most Breathtaking Valleys
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-brand-100">
              From Hunza to Kumrat, Fairy Meadows to Neelum — curated group tours,
              private expeditions, and custom adventures await.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#tours" className="btn-accent">
                Browse {tours.length} Tours
              </a>
              <a
                href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/"}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary border-white/30 text-white hover:bg-white/10"
              >
                Message on Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: Shield, title: "Licensed Operator", desc: "Government registered tourism company" },
            { icon: Star, title: "Expert Guides", desc: "Experienced trip leaders on every departure" },
            { icon: Compass, title: "16+ Destinations", desc: "Northern Pakistan's finest valleys covered" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">{title}</h3>
                <p className="mt-1 text-sm text-stone-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tour catalog */}
      <section id="tours" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title">Our Tour Packages</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-500">
            All packages extracted from our official tour brochures. Tap any tour for
            full itinerary, inclusions, and pricing.
          </p>
        </div>

        {tours.length === 0 ? (
          <div className="mt-12 rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center">
            <p className="text-stone-500">
              No tours loaded yet. Run{" "}
              <code className="rounded bg-stone-100 px-2 py-1 text-sm">npm run db:ingest</code>{" "}
              to parse PDF brochures.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <TourCard
                key={tour.id}
                slug={tour.slug}
                title={tour.title}
                destination={tour.destination}
                durationText={tour.durationText}
                summary={tour.summary}
                imageUrl={tour.imageUrl}
                lowestPrice={tour.lowestPrice}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
