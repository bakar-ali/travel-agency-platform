import Image from "next/image";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TourCardProps {
  slug: string;
  title: string;
  destination: string;
  durationText: string;
  summary: string;
  imageUrl: string;
  lowestPrice: number | null;
}

export function TourCard({
  slug,
  title,
  destination,
  durationText,
  summary,
  imageUrl,
  lowestPrice,
}: TourCardProps) {
  return (
    <article className="card group overflow-hidden">
      <Link href={`/tours/${slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="badge bg-white/90 text-brand-700 backdrop-blur">
              {durationText}
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-1.5 text-sm text-brand-600">
            <MapPin className="h-3.5 w-3.5" />
            {destination}
          </div>
          <h3 className="mt-1 font-display text-xl font-semibold text-stone-900 group-hover:text-brand-700">
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-500">
            {summary}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
            <div>
              {lowestPrice ? (
                <>
                  <span className="text-xs text-stone-400">From</span>
                  <p className="text-lg font-bold text-brand-700">
                    {formatCurrency(lowestPrice)}
                  </p>
                </>
              ) : (
                <span className="text-sm text-stone-400">Contact for pricing</span>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-stone-500">
              <Users className="h-3.5 w-3.5" />
              Group / Private
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
