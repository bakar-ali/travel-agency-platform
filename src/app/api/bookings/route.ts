import { NextRequest, NextResponse } from "next/server";
import { getAllBookings } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const bookings = await getAllBookings({
    tourType: searchParams.get("tourType") || undefined,
    paymentStatus: searchParams.get("paymentStatus") || undefined,
    destination: searchParams.get("destination") || undefined,
    search: searchParams.get("search") || undefined,
  });

  return NextResponse.json(bookings);
}
