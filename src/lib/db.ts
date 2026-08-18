import { prisma } from "@/lib/prisma";
import { parseJsonArray, formatCurrency } from "@/lib/utils";
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
  const tours = await prisma.tour.findMany({
    where: { isActive: true },
    include: { pricingTiers: true },
    orderBy: [{ duration: "asc" }, { title: "asc" }],
  });
  return tours.map(serializeTour);
}

export async function getTourBySlug(slug: string) {
  const tour = await prisma.tour.findUnique({
    where: { slug },
    include: { pricingTiers: true },
  });
  return tour ? serializeTour(tour) : null;
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
