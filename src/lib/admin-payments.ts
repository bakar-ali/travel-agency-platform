import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

function derivePaymentStatus(amountPaid: number, totalPrice: number): PaymentStatus {
  if (amountPaid >= totalPrice) return "PAID";
  if (amountPaid > 0) return "PARTIAL";
  return "PENDING";
}

export async function addPaymentToBooking(
  id: string,
  input: { amount: number; note?: string }
) {
  const existing = await prisma.booking.findUnique({
    where: { id },
    include: { tour: true, customer: true },
  });
  if (!existing) throw new Error("Booking not found");
  if (input.amount <= 0) throw new Error("Payment amount must be greater than zero");

  const newAmountPaid = existing.amountPaid + input.amount;
  const entry = `[${format(new Date(), "dd MMM yyyy")}] +${formatCurrency(input.amount)}${
    input.note?.trim() ? ` — ${input.note.trim()}` : ""
  }`;
  const paymentNotes = existing.paymentNotes
    ? `${existing.paymentNotes}\n${entry}`
    : entry;

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      amountPaid: newAmountPaid,
      paymentStatus: derivePaymentStatus(newAmountPaid, existing.totalPrice),
      paymentNotes,
    },
    include: { tour: true, customer: true },
  });

  return serializeBooking(booking);
}
