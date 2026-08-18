import { NextResponse } from "next/server";
import { getAllTours } from "@/lib/db";

export async function GET() {
  const tours = await getAllTours();
  return NextResponse.json(tours);
}
