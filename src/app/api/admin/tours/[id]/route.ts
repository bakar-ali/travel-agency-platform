import { NextRequest, NextResponse } from "next/server";
import { deleteTour, getTourForAdmin, updateTour } from "@/lib/admin-tours";
import { parseJsonArray } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tour = await getTourForAdmin(id);
    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...tour,
      highlights: parseJsonArray<string>(tour.highlights),
      inclusions: parseJsonArray<string>(tour.inclusions),
      exclusions: parseJsonArray<string>(tour.exclusions),
      itinerary: parseJsonArray(tour.itinerary),
      galleryUrls: parseJsonArray<string>(tour.galleryUrls),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch tour" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tour = await updateTour(id, body);
    return NextResponse.json(tour);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update tour" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteTour(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete tour" }, { status: 500 });
  }
}
