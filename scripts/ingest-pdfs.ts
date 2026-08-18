import path from "path";
import { parseAllTourPdfs } from "./parse-tour-pdf";
import { upsertTours, disconnect } from "./tour-upsert";

/** Local dev only — reads PDFs from /tours (not deployed to server). */
async function main() {
  const toursDir = path.join(process.cwd(), "tours");
  console.log(`\n📂 Reading PDFs from: ${toursDir}\n`);

  const parsed = await parseAllTourPdfs(toursDir);
  console.log(`\n📊 Parsed ${parsed.length} tours. Upserting to database...\n`);

  await upsertTours(parsed);
  console.log(`\n✅ Ingestion complete: ${parsed.length} tours in database.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => disconnect());
