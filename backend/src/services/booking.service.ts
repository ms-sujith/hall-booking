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
// Check Booking Availability
// ====================

export async function isBookingSlotAvailable(
  hallId: number,
  bookingDate: Temporal.Instant,
  startTime: string,
  endTime: string | null,
) {
  const existingBookings = await getBookingsByHallAndDate(hallId, bookingDate);

  const requestedStart = convertTimeToMinutes(startTime);

  const requestedEnd = endTime ? convertTimeToMinutes(endTime) : null;

  if (requestedStart === null) {
    return false;
  }

  for (const existingBooking of existingBookings) {
    // Cancelled and rejected bookings do not block the slot.
    if (
      existingBooking.status === "CANCELLED" ||
      existingBooking.status === "REJECTED"
    ) {
      continue;
    }

    const existingStart = convertTimeToMinutes(existingBooking.startTime);

    const existingEnd = existingBooking.endTime
      ? convertTimeToMinutes(existingBooking.endTime)
      : null;

    if (existingStart === null || existingEnd === null) {
      continue;
    }

    // If requested booking has no end time,
    // it is unavailable when its start is inside an existing booking.
    if (requestedEnd === null) {
      if (requestedStart >= existingStart && requestedStart < existingEnd) {
        return false;
      }
    } else {
      const isOverlapping =
        requestedStart < existingEnd && requestedEnd > existingStart;

      if (isOverlapping) {
        return false;
      }
    }
  }

  return true;
}

// ====================
// Convert HH:MM to Minutes
// ====================

function convertTimeToMinutes(time: string): number | null {
  const parts = time.split(":");

  if (parts.length !== 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
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
