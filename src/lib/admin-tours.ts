import { prisma } from "@/lib/prisma";
import { getTourImage, getTourGallery } from "@/lib/tour-images";
import { loadToursFromJson } from "@/lib/tours-json";
import { slugify } from "@/lib/utils";
import type { TourType } from "@prisma/client";

export interface TourInput {
  title: string;
  destination: string;
  duration: number;
  durationText?: string;
  summary: string;
  overview?: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: { day: number; title: string; activities: string[] }[];
  imageUrl?: string;
  galleryUrls?: string[];
  isActive?: boolean;
  pricingTiers: {
    tourType: TourType;
    label: string;
    price: number;
    description?: string;
  }[];
}

export async function createTour(input: TourInput) {
  const slug = slugify(input.title);
  const imageUrl = input.imageUrl || getTourImage(input.destination, input.title);
  const galleryUrls = input.galleryUrls || getTourGallery(input.destination);
  const durationText =
    input.durationText || `${input.duration} Days / ${Math.max(input.duration - 1, 1)} Nights`;

  const tour = await prisma.tour.create({
    data: {
      slug,
      title: input.title,
      destination: input.destination,
      duration: input.duration,
      durationText,
      summary: input.summary,
      overview: input.overview,
      highlights: JSON.stringify(input.highlights),
      inclusions: JSON.stringify(input.inclusions),
      exclusions: JSON.stringify(input.exclusions),
      itinerary: JSON.stringify(input.itinerary),
      imageUrl,
      galleryUrls: JSON.stringify(galleryUrls),
      isActive: input.isActive ?? true,
      pricingTiers: {
        create: input.pricingTiers.map((tier) => ({
          tourType: tier.tourType,
          label: tier.label,
          price: tier.price,
          description: tier.description,
        })),
      },
    },
    include: { pricingTiers: true },
  });

  return tour;
}

export async function updateTour(id: string, input: TourInput) {
  const slug = slugify(input.title);
  const durationText =
    input.durationText || `${input.duration} Days / ${Math.max(input.duration - 1, 1)} Nights`;

  await prisma.pricingTier.deleteMany({ where: { tourId: id } });

  const tour = await prisma.tour.update({
    where: { id },
    data: {
      slug,
      title: input.title,
      destination: input.destination,
      duration: input.duration,
      durationText,
      summary: input.summary,
      overview: input.overview,
      highlights: JSON.stringify(input.highlights),
      inclusions: JSON.stringify(input.inclusions),
      exclusions: JSON.stringify(input.exclusions),
      itinerary: JSON.stringify(input.itinerary),
      imageUrl: input.imageUrl,
      galleryUrls: JSON.stringify(input.galleryUrls ?? []),
      isActive: input.isActive ?? true,
      pricingTiers: {
        create: input.pricingTiers.map((tier) => ({
          tourType: tier.tourType,
          label: tier.label,
          price: tier.price,
          description: tier.description,
        })),
      },
    },
    include: { pricingTiers: true },
  });

  return tour;
}

export async function deleteTour(id: string) {
  return prisma.tour.delete({ where: { id } });
}

export async function getTourForAdmin(id: string) {
  return prisma.tour.findUnique({
    where: { id },
    include: { pricingTiers: true },
  });
}

export async function syncToursFromJsonIfEmpty() {
  const count = await prisma.tour.count();
  if (count > 0) return;

  const tours = loadToursFromJson();
  if (tours.length === 0) return;

  console.log(`Syncing ${tours.length} tours from data/tours.json into database...`);

  for (const tour of tours) {
    const upserted = await prisma.tour.upsert({
      where: { slug: tour.slug },
      create: {
        slug: tour.slug,
        title: tour.title,
        destination: tour.destination,
        duration: tour.duration,
        durationText: tour.durationText,
        summary: tour.summary,
        overview: tour.overview,
        highlights: JSON.stringify(tour.highlights),
        inclusions: JSON.stringify(tour.inclusions),
        exclusions: JSON.stringify(tour.exclusions),
        itinerary: JSON.stringify(tour.itinerary),
        imageUrl: tour.imageUrl,
        galleryUrls: JSON.stringify(tour.galleryUrls),
        sourcePdf: tour.sourcePdf,
      },
      update: {
        title: tour.title,
        destination: tour.destination,
        duration: tour.duration,
        durationText: tour.durationText,
        summary: tour.summary,
        overview: tour.overview,
        highlights: JSON.stringify(tour.highlights),
        inclusions: JSON.stringify(tour.inclusions),
        exclusions: JSON.stringify(tour.exclusions),
        itinerary: JSON.stringify(tour.itinerary),
        imageUrl: tour.imageUrl,
        galleryUrls: JSON.stringify(tour.galleryUrls),
        sourcePdf: tour.sourcePdf,
      },
    });

    for (const tier of tour.pricingTiers) {
      await prisma.pricingTier.upsert({
        where: {
          tourId_tourType_label: {
            tourId: upserted.id,
            tourType: tier.tourType as TourType,
            label: tier.label,
          },
        },
        create: {
          tourId: upserted.id,
          tourType: tier.tourType as TourType,
          label: tier.label,
          price: tier.price,
          description: tier.description,
        },
        update: { price: tier.price, description: tier.description },
      });
    }
  }
}

export async function listToursForAdmin() {
  try {
    await syncToursFromJsonIfEmpty();
  } catch (error) {
    console.error("Tour sync from JSON failed:", error);
  }

  return prisma.tour.findMany({
    include: { pricingTiers: true, _count: { select: { bookings: true } } },
    orderBy: [{ duration: "asc" }, { title: "asc" }],
  });
}
