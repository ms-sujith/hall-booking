import "temporal-polyfill/global";
import type { Temporal } from "temporal-polyfill";

import { db } from "../db";

// ====================
// Create Payment
// ====================

export async function createPayment(
  bookingId: number,
  amount: string,
  paymentMethod: string,
  transactionId: string | null,
  status: string = "PENDING",
  paidAt: Temporal.Instant | null = null,
) {
  const payment = await db.orm.public.Payment.create({
    bookingId,
    amount,
    paymentMethod,
    transactionId,
    status,
    paidAt,
  });

  return payment;
}

// ====================
// Get All Payments
// ====================

export async function getPayments() {
  const payments = await db.orm.public.Payment.all();

  return payments;
}

// ====================
// Get Payment By ID
// ====================

export async function getPaymentById(id: number) {
  const payments = await db.orm.public.Payment.all();

  const payment = payments.find((payment) => payment.id === id);

  return payment;
}

// ====================
// Get Payment By Booking ID
// ====================

export async function getPaymentByBookingId(bookingId: number) {
  const payments = await db.orm.public.Payment.all();

  const payment = payments.find((payment) => payment.bookingId === bookingId);

  return payment;
}

// ====================
// Get Payments By User ID
// ====================

export async function getPaymentsByUserId(userId: number) {
  const bookings = await db.orm.public.Booking.all();
  const payments = await db.orm.public.Payment.all();

  const userBookingIds = bookings
    .filter((booking) => booking.userId === userId)
    .map((booking) => booking.id);

  const userPayments = payments.filter((payment) =>
    userBookingIds.includes(payment.bookingId),
  );

  return userPayments;
}

// ====================
// Update Payment Status
// ====================

export async function updatePaymentStatus(
  id: number,
  status: string,
  paidAt: Temporal.Instant | null = null,
) {
  const updatedPayment = await db.orm.public.Payment.where({ id }).update({
    status,
    paidAt,
  });

  return updatedPayment;
}

// ====================
// Delete Payment
// ====================

export async function deletePayment(id: number) {
  const deletedPayment = await db.orm.public.Payment.where({ id }).delete();

  return deletedPayment;
}
