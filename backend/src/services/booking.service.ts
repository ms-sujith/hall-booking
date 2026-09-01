import "temporal-polyfill/global";
import type { Temporal } from "temporal-polyfill";

import { db } from "../db";

// ====================
// Create Booking
// ====================

export async function createBooking(
  userId: number,
  hallId: number,
  bookingDate: Temporal.Instant,
  startTime: string,
  endTime: string | null,
  guests: number,
  totalAmount: string,
  status: string = "PENDING",
) {
  const booking = await db.orm.public.Booking.create({
    userId,
    hallId,
    bookingDate,
    startTime,
    endTime,
    guests,
    totalAmount,
    status,
  });

  return booking;
}

// ====================
// Get All Bookings
// ====================

export async function getBookings() {
  const bookings = await db.orm.public.Booking.all();

  return bookings;
}

// ====================
// Get Booking By ID
// ====================

export async function getBookingById(id: number) {
  const bookings = await db.orm.public.Booking.all();

  const booking = bookings.find((booking) => booking.id === id);

  return booking;
}

// ====================
// Get Bookings By User ID
// ====================

export async function getBookingsByUserId(userId: number) {
  const bookings = await db.orm.public.Booking.all();

  const userBookings = bookings.filter((booking) => booking.userId === userId);

  return userBookings;
}

// ====================
// Get Bookings By Hall ID
// ====================

export async function getBookingsByHallId(hallId: number) {
  const bookings = await db.orm.public.Booking.all();

  const hallBookings = bookings.filter((booking) => booking.hallId === hallId);

  return hallBookings;
}

// ====================
// Get Existing Bookings
// For Same Hall + Date
// ====================

export async function getBookingsByHallAndDate(
  hallId: number,
  bookingDate: Temporal.Instant,
) {
  const bookings = await db.orm.public.Booking.all();

  const requestedDate = bookingDate.toString();

  const matchingBookings = bookings.filter((booking) => {
    return (
      booking.hallId === hallId &&
      booking.bookingDate.toString() === requestedDate
    );
  });

  return matchingBookings;
}

// ====================
// Update Booking Status
// ====================

export async function updateBookingStatus(id: number, status: string) {
  const updatedBooking = await db.orm.public.Booking.where({ id }).update({
    status,
  });

  return updatedBooking;
}

// ====================
// Delete Booking
// ====================

export async function deleteBooking(id: number) {
  const deletedBooking = await db.orm.public.Booking.where({ id }).delete();

  return deletedBooking;
}
