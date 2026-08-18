import { NextRequest, NextResponse } from "next/server";
import { createTour, listToursForAdmin } from "@/lib/admin-tours";
import { parseJsonArray } from "@/lib/utils";

export async function GET() {
  try {
    const tours = await listToursForAdmin();
    return NextResponse.json(
      tours.map((t) => ({
        ...t,
        highlights: parseJsonArray<string>(t.highlights),
        inclusions: parseJsonArray<string>(t.inclusions),
        exclusions: parseJsonArray<string>(t.exclusions),
        itinerary: parseJsonArray(t.itinerary),
        galleryUrls: parseJsonArray<string>(t.galleryUrls),
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tour = await createTour(body);
    return NextResponse.json(tour, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create tour" }, { status: 500 });
  }
}
