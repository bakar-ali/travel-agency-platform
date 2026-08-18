import { NextRequest, NextResponse } from "next/server";
import { getAllBookings } from "@/lib/db";
import { createBooking } from "@/lib/admin-bookings";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const booking = await createBooking(body);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
