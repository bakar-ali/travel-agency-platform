import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/db";
import { generateBookingRef } from "@/lib/utils";
import type { PaymentStatus, TourType } from "@prisma/client";

export interface BookingInput {
  tourId: string;
  tourType: TourType;
  startDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  participants: number;
  passengerNames: string[];
  totalPrice?: number;
  amountPaid?: number;
  paymentStatus?: PaymentStatus;
  paymentNotes?: string;
  specialRequests?: string;
}

function calculateTotalPrice(
  tourType: TourType,
  tierPrice: number,
  participants: number
): number {
  return tourType === "GROUP" ? tierPrice : tierPrice * participants;
}

export async function createBooking(input: BookingInput) {
  const tour = await prisma.tour.findUnique({
    where: { id: input.tourId },
    include: { pricingTiers: true },
  });
  if (!tour) throw new Error("Tour not found");

  const tier =
    tour.pricingTiers.find((t) => t.tourType === input.tourType) ??
    tour.pricingTiers[0];

  const totalPrice =
    input.totalPrice ??
    (tier ? calculateTotalPrice(input.tourType, tier.price, input.participants) : 0);

  const startDate = new Date(input.startDate);
  const endDate = addDays(startDate, tour.duration);

  const passengers = input.passengerNames
    .filter(Boolean)
    .map((name) => ({ name: name.trim() }));

  while (passengers.length < input.participants) {
    passengers.push({ name: `Passenger ${passengers.length + 1}` });
  }

  let customer = await prisma.customer.findFirst({
    where: { phone: input.customerPhone.trim() },
  });

  if (customer) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: input.customerName.trim(),
        email: input.customerEmail?.trim() || null,
      },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        name: input.customerName.trim(),
        phone: input.customerPhone.trim(),
        email: input.customerEmail?.trim() || null,
      },
    });
  }

  const booking = await prisma.booking.create({
    data: {
      bookingRef: generateBookingRef(),
      tourId: tour.id,
      customerId: customer.id,
      tourType: input.tourType,
      startDate,
      endDate,
      participants: input.participants,
      passengerList: JSON.stringify(passengers.slice(0, input.participants)),
      totalPrice,
      amountPaid: input.amountPaid ?? 0,
      paymentStatus: input.paymentStatus ?? "PENDING",
      paymentNotes: input.paymentNotes?.trim() || null,
      specialRequests: input.specialRequests?.trim() || null,
    },
    include: { tour: true, customer: true },
  });

  return serializeBooking(booking);
}

export async function updateBooking(id: string, input: Partial<BookingInput>) {
  const existing = await prisma.booking.findUnique({
    where: { id },
    include: { tour: { include: { pricingTiers: true } }, customer: true },
  });
  if (!existing) throw new Error("Booking not found");

  const tourId = input.tourId ?? existing.tourId;
  const tour =
    tourId === existing.tourId
      ? existing.tour
      : await prisma.tour.findUnique({
          where: { id: tourId },
          include: { pricingTiers: true },
        });

  if (!tour) throw new Error("Tour not found");

  const tourType = input.tourType ?? existing.tourType;
  const participants = input.participants ?? existing.participants;
  const tier =
    tour.pricingTiers.find((t) => t.tourType === tourType) ?? tour.pricingTiers[0];

  const totalPrice =
    input.totalPrice ??
    (tier ? calculateTotalPrice(tourType, tier.price, participants) : existing.totalPrice);

  const startDate = input.startDate ? new Date(input.startDate) : existing.startDate;
  const endDate = addDays(startDate, tour.duration);

  if (input.customerPhone || input.customerName) {
    await prisma.customer.update({
      where: { id: existing.customerId },
      data: {
        ...(input.customerName && { name: input.customerName.trim() }),
        ...(input.customerPhone && { phone: input.customerPhone.trim() }),
        ...(input.customerEmail !== undefined && {
          email: input.customerEmail?.trim() || null,
        }),
      },
    });
  }

  let passengerList = existing.passengerList;
  if (input.passengerNames) {
    const passengers = input.passengerNames
      .filter(Boolean)
      .map((name) => ({ name: name.trim() }));
    while (passengers.length < participants) {
      passengers.push({ name: `Passenger ${passengers.length + 1}` });
    }
    passengerList = JSON.stringify(passengers.slice(0, participants));
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...(input.tourId && { tourId: input.tourId }),
      tourType,
      startDate,
      endDate,
      participants,
      passengerList,
      totalPrice,
      ...(input.amountPaid !== undefined && { amountPaid: input.amountPaid }),
      ...(input.paymentStatus && { paymentStatus: input.paymentStatus }),
      ...(input.paymentNotes !== undefined && {
        paymentNotes: input.paymentNotes?.trim() || null,
      }),
      ...(input.specialRequests !== undefined && {
        specialRequests: input.specialRequests?.trim() || null,
      }),
    },
    include: { tour: true, customer: true },
  });

  return serializeBooking(booking);
}

export async function deleteBooking(id: string) {
  return prisma.booking.delete({ where: { id } });
}
