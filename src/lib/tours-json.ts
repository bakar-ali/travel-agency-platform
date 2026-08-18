import fs from "fs";
import path from "path";

export interface JsonTour {
  title: string;
  slug: string;
  destination: string;
  duration: number;
  durationText: string;
  summary: string;
  overview: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: { day: number; title: string; activities: string[] }[];
  pricingTiers: {
    tourType: string;
    label: string;
    price: number;
    description?: string;
  }[];
  imageUrl: string;
  galleryUrls: string[];
  sourcePdf?: string;
}

function jsonPath() {
  return path.join(process.cwd(), "data", "tours.json");
}

export function loadToursFromJson(): JsonTour[] {
  const file = jsonPath();
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as JsonTour[];
  } catch {
    return [];
  }
}

export function serializeJsonTour(tour: JsonTour) {
  const tiers = tour.pricingTiers.map((tier, index) => ({
    id: `${tour.slug}-tier-${index}`,
    tourId: tour.slug,
    tourType: tier.tourType,
    label: tier.label,
    price: tier.price,
    currency: "PKR",
    description: tier.description ?? null,
    minPax: 1,
    maxPax: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  return {
    id: tour.slug,
    slug: tour.slug,
    title: tour.title,
    destination: tour.destination,
    duration: tour.duration,
    durationText: tour.durationText,
    summary: tour.summary,
    overview: tour.overview,
    highlights: tour.highlights,
    inclusions: tour.inclusions,
    exclusions: tour.exclusions,
    itinerary: tour.itinerary,
    imageUrl: tour.imageUrl,
    galleryUrls: tour.galleryUrls,
    sourcePdf: tour.sourcePdf ?? null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    pricingTiers: tiers,
    lowestPrice: tiers.length ? Math.min(...tiers.map((t) => t.price)) : null,
  };
}

export function getAllToursFromJson() {
  return loadToursFromJson().map(serializeJsonTour);
}

export function getTourBySlugFromJson(slug: string) {
  const tour = loadToursFromJson().find((t) => t.slug === slug);
  return tour ? serializeJsonTour(tour) : null;
}
