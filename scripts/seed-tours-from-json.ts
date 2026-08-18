import fs from "fs";
import path from "path";
import { upsertTours, disconnect } from "./tour-upsert";
import type { ParsedTour } from "./parse-tour-pdf";

async function main() {
  const jsonPath = path.join(process.cwd(), "data", "tours.json");

  if (!fs.existsSync(jsonPath)) {
    console.error("data/tours.json not found. Run: npm run db:export");
    process.exit(1);
  }

  const tours = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as ParsedTour[];
  console.log(`\n📊 Seeding ${tours.length} tours from data/tours.json...\n`);

  await upsertTours(tours);
  console.log(`\n✅ Seeding complete.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => disconnect());
