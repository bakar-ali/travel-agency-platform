import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}

export interface PricingInfo {
  tourType: "GROUP" | "PRIVATE" | "CUSTOM";
  label: string;
  price: number;
  description?: string;
}

export interface ParsedTour {
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
  itinerary: ItineraryDay[];
  pricingTiers: PricingInfo[];
  sourcePdf: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseFilename(filename: string): {
  duration: number;
  destination: string;
  tourType: "GROUP" | "PRIVATE" | "CUSTOM";
  title: string;
} {
  const base = filename.replace(/\.pdf$/i, "").replace(/\s+\d+$/, "").trim();
  const durationMatch = base.match(/^(\d+)\s*Days?\s+(.+)$/i);
  const duration = durationMatch ? parseInt(durationMatch[1], 10) : 3;
  let rest = durationMatch ? durationMatch[2] : base;

  let tourType: "GROUP" | "PRIVATE" | "CUSTOM" = "GROUP";
  if (/private/i.test(rest)) {
    tourType = "PRIVATE";
    rest = rest.replace(/\s*private\s*tour\s*/i, " ").trim();
  } else if (/custom/i.test(rest)) {
    tourType = "CUSTOM";
    rest = rest.replace(/\s*custom\s*tour\s*/i, " ").trim();
  } else {
    rest = rest.replace(/\s*group\s*tour\s*/i, " ").trim();
  }

  const destination = rest.trim();
  const title = `${duration} Days ${destination} ${tourType === "GROUP" ? "Group" : tourType === "PRIVATE" ? "Private" : "Custom"} Tour`;

  return { duration, destination, tourType, title };
}

function extractPlaces(text: string): string[] {
  const match = text.match(
    /Places Covered\s+([\s\S]*?)(?=Day\s+\d{2}:|TRAVEL\s*\n\s*ITINERARY)/i
  );
  if (!match) return [];

  return match[1]
    .split(/[|,\n]/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 2 && !/^places?$/i.test(p));
}

function extractItinerary(text: string): ItineraryDay[] {
  const days: ItineraryDay[] = [];
  const dayRegex = /Day\s+(\d{2}):\s*\n([\s\S]*?)(?=Day\s+\d{2}:|TRAVEL\s*\n\s*ITINERARY|SERVICES|$)/gi;
  let match;

  while ((match = dayRegex.exec(text)) !== null) {
    const dayNum = parseInt(match[1], 10);
    const block = match[2].trim();
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !/^TRAVEL$/i.test(l));

    const title = lines[0] || `Day ${dayNum}`;
    const activities = lines.slice(1).length > 0 ? lines.slice(1) : lines;

    days.push({ day: dayNum, title, activities });
  }

  return days.sort((a, b) => a.day - b.day);
}

function extractInclusions(text: string): string[] {
  const match = text.match(
    /(?:Services\s+included|퐒퐞퐫퐯퐢퐜퐞퐬\s+퐢퐧퐜퐥퐮퐝퐞퐝)\s*([\s\S]*?)(?:Package Price|퐒퐞퐫퐯퐢퐜퐞퐬 Not Include|Services Not Include)/i
  );
  if (!match) return [];

  return match[1]
    .split(/[-•]|\n/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 10);
}

function extractExclusions(text: string): string[] {
  const match = text.match(
    /(?:Services Not Include|퐒퐞퐫퐯퐢퐜퐞퐬 Not Include)\s*([\s\S]*?)(?:Food Menu|BOOKING METHOD|Cancelation Policy|$)/i
  );
  if (!match) return [];

  return match[1]
    .split(/[-•]|\n/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 5);
}

function extractPricing(text: string, defaultType: "GROUP" | "PRIVATE" | "CUSTOM"): PricingInfo[] {
  const tiers: PricingInfo[] = [];
  const priceSection = text.match(/Package Price:\s*([\s\S]*?)(?:Food Menu|BOOKING METHOD|Cancelation Policy)/i);
  if (!priceSection) return tiers;

  const block = priceSection[1];
  const priceRegex = /PKR\s*([\d,]+)\s*\/?\s*[-–]?\s*\(?([^)\n]*)\)?/gi;
  let match;

  while ((match = priceRegex.exec(block)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ""));
    const label = match[2]?.trim() || "Standard Package";
    tiers.push({
      tourType: defaultType,
      label: label.replace(/\s+/g, " "),
      price,
      description: label,
    });
  }

  if (tiers.length === 0) {
    const simpleMatch = block.match(/PKR\s*([\d,]+)/i);
    if (simpleMatch) {
      tiers.push({
        tourType: defaultType,
        label: "Standard Package",
        price: parseFloat(simpleMatch[1].replace(/,/g, "")),
      });
    }
  }

  return tiers;
}

function dedupeRepeatedText(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 4) return cleaned;
  const mid = Math.floor(cleaned.length / 2);
  const first = cleaned.slice(0, mid).trim();
  const second = cleaned.slice(mid).trim();
  if (first && second.startsWith(first)) return first;
  return cleaned;
}

function extractDestinationFromText(text: string, fallback: string): string {
  const planMatch = text.match(
    /PLAN FOR \d{2} DAYS\s*([A-Z][A-Z\s]*?)(?:Group Tour|PLAN FOR)/i
  );
  if (planMatch) {
    const dest = dedupeRepeatedText(planMatch[1]);
    if (dest.length > 2 && !/^plan for/i.test(dest)) {
      return dest
        .split(" ")
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" ");
    }
  }
  return fallback;
}

function buildSummary(destination: string, duration: number, highlights: string[]): string {
  const placePreview = highlights.slice(0, 4).join(", ");
  return `Discover the breathtaking beauty of ${destination} on this ${duration}-day adventure. Explore ${placePreview}${highlights.length > 4 ? " and more" : ""} with expert guides, comfortable transport, and unforgettable mountain experiences.`;
}

export async function parseTourPdf(filePath: string): Promise<ParsedTour> {
  const filename = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const { text } = await pdf(buffer);

  const fromFile = parseFilename(filename);
  const pdfDestination = extractDestinationFromText(text, fromFile.destination);
  const destination =
    fromFile.destination.length > 3 ? fromFile.destination : pdfDestination;
  const highlights = extractPlaces(text);
  const itinerary = extractItinerary(text);
  const inclusions = extractInclusions(text);
  const exclusions = extractExclusions(text);
  const pricingTiers = extractPricing(text, fromFile.tourType);

  const durationFromText = text.match(/PLAN FOR (\d{2}) DAYS/i);
  const duration = durationFromText
    ? parseInt(durationFromText[1], 10)
    : fromFile.duration;

  const typeLabel =
    fromFile.tourType === "GROUP"
      ? "Group"
      : fromFile.tourType === "PRIVATE"
        ? "Private"
        : "Custom";
  const title = fromFile.title.includes(destination)
    ? fromFile.title
    : `${duration} Days ${destination} ${typeLabel} Tour`;

  return {
    title,
    slug: slugify(fromFile.title),
    destination,
    duration,
    durationText: `${duration} Days / ${Math.max(duration - 1, 1)} Nights`,
    summary: buildSummary(destination, duration, highlights),
    overview: highlights.length
      ? `This ${duration}-day tour covers ${highlights.join(", ")}.`
      : `An unforgettable ${duration}-day journey through ${destination}.`,
    highlights,
    inclusions,
    exclusions,
    itinerary,
    pricingTiers,
    sourcePdf: filename,
  };
}

export async function parseAllTourPdfs(toursDir: string): Promise<ParsedTour[]> {
  const files = fs
    .readdirSync(toursDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));

  const tours: ParsedTour[] = [];
  for (const file of files) {
    try {
      const parsed = await parseTourPdf(path.join(toursDir, file));
      tours.push(parsed);
      console.log(`✓ Parsed: ${file}`);
    } catch (err) {
      console.error(`✗ Failed: ${file}`, err);
    }
  }

  return tours.sort((a, b) => a.duration - b.duration || a.title.localeCompare(b.title));
}
