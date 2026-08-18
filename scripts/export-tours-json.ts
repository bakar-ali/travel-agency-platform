import fs from "fs";
import path from "path";
import { parseAllTourPdfs } from "./parse-tour-pdf";
import { getTourImage, getTourGallery } from "../src/lib/tour-images";

async function main() {
  const toursDir = path.join(process.cwd(), "tours");
  const outPath = path.join(process.cwd(), "data", "tours.json");

  if (!fs.existsSync(toursDir)) {
    console.error("No /tours directory found. Place PDF brochures there first.");
    process.exit(1);
  }

  console.log(`\n📂 Parsing PDFs from: ${toursDir}\n`);
  const parsed = await parseAllTourPdfs(toursDir);

  const tours = parsed.map((tour) => ({
    ...tour,
    imageUrl: getTourImage(tour.destination, tour.title),
    galleryUrls: getTourGallery(tour.destination),
  }));

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(tours, null, 2));

  console.log(`\n✅ Exported ${tours.length} tours to data/tours.json`);
  console.log("   Commit this file to Git — PDFs stay local only.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
