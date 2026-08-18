import { prisma } from "@/lib/prisma";
import { parseJsonArray, formatCurrency } from "@/lib/utils";
import { getAllToursFromJson, getTourBySlugFromJson } from "@/lib/tours-json";
import type { Tour, PricingTier, Booking, Customer } from "@prisma/client";

export type TourWithPricing = Tour & { pricingTiers: PricingTier[] };

export type BookingWithRelations = Booking & {
  tour: Tour;
  customer: Customer;
};

export function serializeTour(tour: TourWithPricing) {
  return {
    ...tour,
    highlights: parseJsonArray<string>(tour.highlights),
    inclusions: parseJsonArray<string>(tour.inclusions),
    exclusions: parseJsonArray<string>(tour.exclusions),
    itinerary: parseJsonArray<{ day: number; title: string; activities: string[] }>(
      tour.itinerary
    ),
    galleryUrls: parseJsonArray<string>(tour.galleryUrls),
    lowestPrice: tour.pricingTiers.length
      ? Math.min(...tour.pricingTiers.map((p) => p.price))
      : null,
  };
}

export function serializeBooking(booking: BookingWithRelations) {
  return {
    ...booking,
    passengerList: parseJsonArray<{ name: string; cnic?: string }>(
      booking.passengerList
    ),
    formattedTotal: formatCurrency(booking.totalPrice),
    formattedPaid: formatCurrency(booking.amountPaid),
  };
}

export async function getAllTours() {
  try {
    const tours = await prisma.tour.findMany({
      where: { isActive: true },
      include: { pricingTiers: true },
      orderBy: [{ duration: "asc" }, { title: "asc" }],
    });
    if (tours.length > 0) {
      return tours.map(serializeTour);
    }
  } catch (error) {
    console.error("Database tour fetch failed, using JSON fallback:", error);
  }

  return getAllToursFromJson();
}

export async function getTourBySlug(slug: string) {
  try {
    const tour = await prisma.tour.findUnique({
      where: { slug },
      include: { pricingTiers: true },
    });
    if (tour) return serializeTour(tour);
  } catch (error) {
    console.error("Database tour lookup failed, using JSON fallback:", error);
  }

  return getTourBySlugFromJson(slug);
}

export async function getAllBookings(filters?: {
  tourType?: string;
  paymentStatus?: string;
  destination?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.tourType) where.tourType = filters.tourType;
  if (filters?.paymentStatus) where.paymentStatus = filters.paymentStatus;

  if (filters?.destination) {
    where.tour = { destination: { contains: filters.destination } };
  }

  if (filters?.search) {
    where.OR = [
      { bookingRef: { contains: filters.search } },
      { customer: { name: { contains: filters.search } } },
      { customer: { phone: { contains: filters.search } } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { tour: true, customer: true },
    orderBy: { startDate: "asc" },
  });

  return bookings.map(serializeBooking);
}
