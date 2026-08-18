import { PrismaClient, PaymentStatus, TourType } from "@prisma/client";
import { generateBookingRef } from "../src/lib/utils";

const prisma = new PrismaClient();

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

const DEMO_CUSTOMERS = [
  { name: "Ahmed Hassan", phone: "+92 300 1234567", email: "ahmed@email.com" },
  { name: "Fatima Khan", phone: "+92 321 9876543", email: "fatima@email.com" },
  { name: "Usman Ali", phone: "+92 333 5551234", email: "usman@email.com" },
  { name: "Sara Malik", phone: "+92 345 7778899", email: "sara@email.com" },
  { name: "Bilal Sheikh", phone: "+92 312 4445566", email: "bilal@email.com" },
  { name: "Ayesha Raza", phone: "+92 334 2223344", email: "ayesha@email.com" },
];

async function main() {
  const tourCount = await prisma.tour.count();
  if (tourCount === 0) {
    console.log("No tours found. Run npm run db:ingest first.");
    return;
  }

  const existingBookings = await prisma.booking.count();
  if (existingBookings > 0) {
    console.log(`Database already has ${existingBookings} bookings. Skipping seed.`);
    return;
  }

  const tours = await prisma.tour.findMany({ include: { pricingTiers: true } });
  const now = new Date();

  const bookingsData = [
    { tourIdx: 0, customerIdx: 0, tourType: "GROUP" as TourType, weeks: 1, pax: 4, status: "PAID" as PaymentStatus, paidRatio: 1 },
    { tourIdx: 1, customerIdx: 1, tourType: "GROUP" as TourType, weeks: 2, pax: 2, status: "PARTIAL" as PaymentStatus, paidRatio: 0.5 },
    { tourIdx: 2, customerIdx: 2, tourType: "PRIVATE" as TourType, weeks: 0, pax: 6, status: "PENDING" as PaymentStatus, paidRatio: 0 },
    { tourIdx: 3, customerIdx: 3, tourType: "GROUP" as TourType, weeks: 3, pax: 5, status: "PAID" as PaymentStatus, paidRatio: 1 },
    { tourIdx: 4, customerIdx: 4, tourType: "CUSTOM" as TourType, weeks: 4, pax: 8, status: "PARTIAL" as PaymentStatus, paidRatio: 0.3 },
    { tourIdx: 5, customerIdx: 5, tourType: "GROUP" as TourType, weeks: 5, pax: 3, status: "PENDING" as PaymentStatus, paidRatio: 0 },
    { tourIdx: 6, customerIdx: 0, tourType: "GROUP" as TourType, weeks: 6, pax: 4, status: "PAID" as PaymentStatus, paidRatio: 1 },
    { tourIdx: 7, customerIdx: 1, tourType: "PRIVATE" as TourType, weeks: 2, pax: 4, status: "PARTIAL" as PaymentStatus, paidRatio: 0.5 },
  ];

  for (const b of bookingsData) {
    const tour = tours[b.tourIdx % tours.length];
    const customerData = DEMO_CUSTOMERS[b.customerIdx];

    const customer = await prisma.customer.upsert({
      where: { id: `seed-customer-${b.customerIdx}` },
      create: { id: `seed-customer-${b.customerIdx}`, ...customerData },
      update: customerData,
    });

    const tier =
      tour.pricingTiers.find((t) => t.tourType === b.tourType) ??
      tour.pricingTiers[0];
    const totalPrice = tier ? tier.price * (b.tourType === "GROUP" ? 1 : b.pax) : 25000;
    const amountPaid = Math.round(totalPrice * b.paidRatio);

    const startDate = addWeeks(now, b.weeks);
    const endDate = addDays(startDate, tour.duration);

    const passengers = Array.from({ length: b.pax }, (_, i) => ({
      name: i === 0 ? customerData.name : `Passenger ${i + 1}`,
      cnic: `35202-${1000000 + b.customerIdx * 100 + i}-${i + 1}`,
    }));

    await prisma.booking.create({
      data: {
        bookingRef: generateBookingRef(),
        tourId: tour.id,
        customerId: customer.id,
        tourType: b.tourType,
        startDate,
        endDate,
        participants: b.pax,
        passengerList: JSON.stringify(passengers),
        totalPrice,
        amountPaid,
        paymentStatus: b.status,
        paymentNotes:
          b.status === "PARTIAL"
            ? "50% deposit received via bank transfer"
            : b.status === "PENDING"
              ? "Awaiting initial payment"
              : "Full payment confirmed",
      },
    });
  }

  console.log(`✅ Seeded ${bookingsData.length} demo bookings.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
