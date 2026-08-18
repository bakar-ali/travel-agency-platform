import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function ensureDatabaseUrl() {
  let url = process.env.DATABASE_URL;
  if (!url) {
    console.error("FATAL: DATABASE_URL is not set in Dokploy environment.");
    return null;
  }
  if (!url.includes("sslmode=")) {
    url += url.includes("?") ? "&sslmode=disable" : "?sslmode=disable";
    process.env.DATABASE_URL = url;
    console.log("Added sslmode=disable to DATABASE_URL");
  }
  return url;
}

async function seedToursFromJson() {
  const jsonPath = path.join(root, "data", "tours.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("data/tours.json not found.");
    return false;
  }

  const tours = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const prisma = new PrismaClient();
  console.log(`Seeding ${tours.length} tours from data/tours.json...`);

  try {
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

      const existingTiers = await prisma.pricingTier.findMany({
        where: { tourId: upserted.id },
      });
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

    const count = await prisma.tour.count();
    console.log(`Seeding complete — ${count} tours in database.`);
    return count > 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Seeding failed:", message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function waitForDb(retries = 15) {
  const prisma = new PrismaClient();
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect();
      await prisma.$disconnect();
      console.log("Database connection OK.");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`DB connect attempt ${i}/${retries} failed:`, message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return false;
}

function parseSqlStatements(sql) {
  const cleaned = sql
    .replace(/^\uFEFF/, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  return cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function verifyTourTable(prisma) {
  const result = await prisma.$queryRawUnsafe(
    `SELECT to_regclass('public."Tour"') AS tour_table`
  );
  return Boolean(result?.[0]?.tour_table);
}

async function applySqlMigration() {
  const sqlPath = path.join(
    root,
    "prisma/migrations/20250818100000_init/migration.sql"
  );
  if (!fs.existsSync(sqlPath)) {
    console.error("Migration SQL file not found.");
    return false;
  }

  const sql = fs.readFileSync(sqlPath, "utf-8");
  const statements = parseSqlStatements(sql);
  const prisma = new PrismaClient();

  try {
    console.log(`Executing ${statements.length} SQL statements...`);
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.split("\n")[0].slice(0, 80);
      try {
        await prisma.$executeRawUnsafe(`${statement};`);
        console.log(`  [${i + 1}/${statements.length}] OK: ${preview}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("already exists") ||
          msg.includes("duplicate key") ||
          msg.includes("42P07") ||
          msg.includes("42710")
        ) {
          console.log(`  [${i + 1}/${statements.length}] SKIP (exists): ${preview}`);
          continue;
        }
        console.error(`  [${i + 1}/${statements.length}] FAIL: ${preview}`);
        console.error(`    ${msg}`);
        throw err;
      }
    }

    const ok = await verifyTourTable(prisma);
    if (!ok) {
      console.error("Tour table still missing after SQL migration.");
      return false;
    }

    console.log("SQL migration verified — Tour table exists.");
    return true;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (!ensureDatabaseUrl()) {
    process.exit(1);
  }

  console.log("Checking database connection...");
  const connected = await waitForDb();
  if (!connected) {
    console.error(
      "WARNING: Could not connect to database. App will start but tours won't load."
    );
    return;
  }

  console.log("Applying database schema via SQL...");
  const schemaOk = await applySqlMigration();
  if (!schemaOk) {
    console.error("WARNING: Could not apply database schema.");
    return;
  }

  await seedToursFromJson();

  console.log("Startup tasks complete.");
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Startup error (continuing anyway):", message);
});
