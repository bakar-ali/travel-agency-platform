import fs from "fs";
import path from "path";
import { PrismaClient, TourType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(process.cwd(), "data", "tours.json");

  if (!fs.existsSync(jsonPath)) {
    console.error("data/tours.json not found.");
    process.exit(1);
  }

  const tours = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`Seeding ${tours.length} tours from data/tours.json...`);

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
            tourType: tier.tourType,
            label: tier.label,
          },
        },
        create: {
          tourId: upserted.id,
          tourType: tier.tourType,
          label: tier.label,
          price: tier.price,
          description: tier.description,
        },
        update: { price: tier.price, description: tier.description },
      });
    }

    const existingTiers = await prisma.pricingTier.findMany({ where: { tourId: upserted.id } });
    const basePrice = tour.pricingTiers[0]?.price ?? 25000;

    if (!existingTiers.some((t) => t.tourType === "PRIVATE")) {
      await prisma.pricingTier.create({
        data: {
          tourId: upserted.id,
          tourType: "PRIVATE",
          label: "Private Tour (up to 6 pax)",
          price: Math.round(basePrice * 2.5),
          description: "Exclusive vehicle and flexible schedule",
        },
      });
    }

    if (!existingTiers.some((t) => t.tourType === "CUSTOM")) {
      await prisma.pricingTier.create({
        data: {
          tourId: upserted.id,
          tourType: "CUSTOM",
          label: "Custom Itinerary",
          price: Math.round(basePrice * 3),
          description: "Tailored route and dates — contact for quote",
        },
      });
    }

    console.log(`  ✓ ${tour.title}`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
