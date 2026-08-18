import path from "path";
import { PrismaClient, TourType } from "@prisma/client";
import { parseAllTourPdfs } from "./parse-tour-pdf";
import { getTourImage, getTourGallery } from "../src/lib/tour-images";

const prisma = new PrismaClient();

async function main() {
  const toursDir = path.join(process.cwd(), "tours");
  console.log(`\n📂 Reading PDFs from: ${toursDir}\n`);

  const parsed = await parseAllTourPdfs(toursDir);
  console.log(`\n📊 Parsed ${parsed.length} tours. Upserting to database...\n`);

  for (const tour of parsed) {
    const imageUrl = getTourImage(tour.destination, tour.title);
    const galleryUrls = getTourGallery(tour.destination);

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
        imageUrl,
        galleryUrls: JSON.stringify(galleryUrls),
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
        imageUrl,
        galleryUrls: JSON.stringify(galleryUrls),
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
        update: {
          price: tier.price,
          description: tier.description,
        },
      });
    }

    // Add private/custom tier estimates if only group pricing exists
    const existingTiers = await prisma.pricingTier.findMany({
      where: { tourId: upserted.id },
    });
    const hasPrivate = existingTiers.some((t) => t.tourType === "PRIVATE");
    const basePrice = tour.pricingTiers[0]?.price ?? 25000;

    if (!hasPrivate) {
      await prisma.pricingTier.upsert({
        where: {
          tourId_tourType_label: {
            tourId: upserted.id,
            tourType: "PRIVATE",
            label: "Private Tour (up to 6 pax)",
          },
        },
        create: {
          tourId: upserted.id,
          tourType: "PRIVATE",
          label: "Private Tour (up to 6 pax)",
          price: Math.round(basePrice * 2.5),
          description: "Exclusive vehicle and flexible schedule",
        },
        update: {},
      });
    }

    const hasCustom = existingTiers.some((t) => t.tourType === "CUSTOM");
    if (!hasCustom) {
      await prisma.pricingTier.upsert({
        where: {
          tourId_tourType_label: {
            tourId: upserted.id,
            tourType: "CUSTOM",
            label: "Custom Itinerary",
          },
        },
        create: {
          tourId: upserted.id,
          tourType: "CUSTOM",
          label: "Custom Itinerary",
          price: Math.round(basePrice * 3),
          description: "Tailored route and dates — contact for quote",
        },
        update: {},
      });
    }

    console.log(`  ✓ ${tour.title}`);
  }

  console.log(`\n✅ Ingestion complete: ${parsed.length} tours in database.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
