import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

async function main() {
  const pdfPath = path.join(
    process.cwd(),
    "tours",
    "5 Days Hunza Valley Group Tour 2.pdf"
  );
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdf(buffer);
  console.log("Pages:", data.numpages);
  console.log("Text length:", data.text.length);
  console.log("--- FIRST 4000 CHARS ---");
  console.log(data.text.slice(0, 4000));
}

main().catch(console.error);
