import { db } from "../db";
import "temporal-polyfill/global";
import { Temporal } from "temporal-polyfill";
import type { Request, Response } from "express";

import {
  createBooking,
  getBookings,
  getBookingById,
  getBookingsByUserId,
  getBookingsByHallId,
  getBookingsByHallAndDate,
  updateBookingStatus,
  deleteBooking,
} from "../services/booking.service";

import {
  createBookingSchema,
  bookingIdParamSchema,
  hallIdParamSchema,
  updateBookingStatusSchema,
} from "../validators/booking.validator";

// ====================
// Create Booking
// POST /bookings
// CUSTOMER only
// ====================

export async function createBookingController(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result = createBookingSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { hallId, bookingDate, startTime, endTime, guests } = result.data;

    const numericHallId = hallId;
    const numericGuests = guests;

    // ====================
    // Parse booking date
    // ====================

    let parsedBookingDate: Temporal.Instant;

    try {
      parsedBookingDate = Temporal.Instant.from(bookingDate);
    } catch {
      return res.status(400).json({
        message: "Invalid booking date",
      });
    }

    // ====================
    // Get Hall
    // ====================

    const hall = await db.orm.public.Hall.where({
      id: numericHallId,
    }).first();

    if (!hall) {
      return res.status(404).json({
        message: "Hall not found",
      });
    }

    // ====================
    // Check Guest Capacity
    // ====================

    if (numericGuests > hall.capacity) {
      return res.status(400).json({
        message: `Guest count exceeds hall capacity of ${hall.capacity}`,
      });
    }

    // ====================
    // Validate Time
    // ====================

    if (endTime) {
      const startMinutes = convertTimeToMinutes(startTime);
      const endMinutes = convertTimeToMinutes(endTime);

      if (startMinutes === null || endMinutes === null) {
        return res.status(400).json({
          message: "Invalid time format. Use HH:MM",
        });
      }

      if (startMinutes >= endMinutes) {
        return res.status(400).json({
          message: "End time must be after start time",
        });
      }
    }

    // ====================
    // Check Existing Bookings
    // ====================

    const existingBookings = await getBookingsByHallAndDate(
      numericHallId,
      parsedBookingDate,
    );

    const requestedStart = convertTimeToMinutes(startTime);
    const requestedEnd = endTime ? convertTimeToMinutes(endTime) : null;

    if (requestedStart === null) {
      return res.status(400).json({
        message: "Invalid start time. Use HH:MM",
      });
    }

    for (const existingBooking of existingBookings) {
      // Ignore rejected/cancelled bookings
      if (
        existingBooking.status === "REJECTED" ||
        existingBooking.status === "CANCELLED"
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
      // treat it as unavailable when it starts
      // inside an existing booking.
      if (requestedEnd === null) {
        if (requestedStart >= existingStart && requestedStart < existingEnd) {
          return res.status(409).json({
            message: "Booking slot is unavailable for the selected time",
          });
        }
      } else {
        const isOverlapping =
          requestedStart < existingEnd && requestedEnd > existingStart;

        if (isOverlapping) {
          return res.status(409).json({
            message: "Booking slot is unavailable for the selected time",
          });
        }
      }
    }

    // ====================
    // Calculate Amount
    // ====================

    const totalAmount = String(hall.price);

    // ====================
    // Create Booking
    // ====================

    const booking = await createBooking(
      Number(user.userId),
      numericHallId,
      parsedBookingDate,
      startTime,
      endTime ?? null,
      numericGuests,
      totalAmount,
      "PENDING",
    );

    console.log("Booking created successfully!");

    return res.status(201).json(booking);
  } catch (error) {
    console.error("Failed to create booking:", error);

    return res.status(500).json({
      message: "Failed to create booking",
    });
  }
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
// Get All Bookings
// GET /bookings
// ====================

export async function getBookingsController(req: Request, res: Response) {
  try {
    const bookings = await getBookings();

    console.log("Bookings fetched successfully!");

    return res.json(bookings);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);

    return res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
}

// ====================
// Get Booking By ID
// GET /bookings/:id
// CUSTOMER → own bookings only
// OWNER → own hall bookings only
// ADMIN → any booking
// ====================

export async function getBookingByIdController(req: Request, res: Response) {
  try {
    const result = bookingIdParamSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const id = result.data.id;

    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const booking = await getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // ====================
    // ADMIN
    // ====================

    if (user.role === "ADMIN") {
      return res.json(booking);
    }

    // ====================
    // CUSTOMER
    // ====================

    if (user.role === "CUSTOMER") {
      if (booking.userId !== Number(user.userId)) {
        return res.status(403).json({
          message: "You can only view your own bookings",
        });
      }

      return res.json(booking);
    }

    // ====================
    // OWNER
    // ====================

    if (user.role === "OWNER") {
      const hallOwner = await db.orm.public.HallOwner.where({
        userId: Number(user.userId),
      }).first();

      if (!hallOwner) {
        return res.status(403).json({
          message: "Hall owner profile not found",
        });
      }

      const hall = await db.orm.public.Hall.where({
        id: booking.hallId,
      }).first();

      if (!hall) {
        return res.status(404).json({
          message: "Hall not found",
        });
      }

      if (hall.ownerId !== hallOwner.id) {
        return res.status(403).json({
          message: "You can only view bookings for your own halls",
        });
      }

      return res.json(booking);
    }

    return res.status(403).json({
      message: "Access denied",
    });
  } catch (error) {
    console.error("Failed to fetch booking:", error);

    return res.status(500).json({
      message: "Failed to fetch booking",
    });
  }
}

// ====================
// Get My Bookings
// GET /bookings/my
// ====================

export async function getMyBookingsController(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const bookings = await getBookingsByUserId(Number(user.userId));

    return res.json(bookings);
  } catch (error) {
    console.error("Failed to fetch user bookings:", error);

    return res.status(500).json({
      message: "Failed to fetch user bookings",
    });
  }
}

// ====================
// Get Bookings By Hall
// GET /bookings/hall/:hallId
// OWNER / ADMIN
// ====================

export async function getBookingsByHallController(req: Request, res: Response) {
  try {
    const result = hallIdParamSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const hallId = result.data.hallId;

    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // ADMIN can view bookings for any hall
    if (user.role === "ADMIN") {
      const bookings = await getBookingsByHallId(hallId);

      return res.json(bookings);
    }

    // OWNER can view bookings only for their own halls
    if (user.role === "OWNER") {
      const hallOwner = await db.orm.public.HallOwner.where({
        userId: Number(user.userId),
      }).first();

      if (!hallOwner) {
        return res.status(403).json({
          message: "Hall owner profile not found",
        });
      }

      const hall = await db.orm.public.Hall.where({
        id: hallId,
      }).first();

      if (!hall) {
        return res.status(404).json({
          message: "Hall not found",
        });
      }

      if (hall.ownerId !== hallOwner.id) {
        return res.status(403).json({
          message: "You can only view bookings for your own halls",
        });
      }

      const bookings = await getBookingsByHallId(hallId);

      return res.json(bookings);
    }

    return res.status(403).json({
      message: "Access denied",
    });
  } catch (error) {
    console.error("Failed to fetch hall bookings:", error);

    return res.status(500).json({
      message: "Failed to fetch hall bookings",
    });
  }
}

// ====================
// Update Booking Status
// PATCH /bookings/:id/status
// OWNER → own hall bookings only
// ADMIN → any booking
// ====================

export async function updateBookingStatusController(
  req: Request,
  res: Response,
) {
  try {
    const idResult = bookingIdParamSchema.safeParse(req.params);

    if (!idResult.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: idResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const statusResult = updateBookingStatusSchema.safeParse(req.body);

    if (!statusResult.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: statusResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const id = idResult.data.id;
    const status = statusResult.data.status;

    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const booking = await getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // ====================
    // ADMIN
    // Admin can update any booking
    // ====================

    if (user.role === "ADMIN") {
      const updatedBooking = await updateBookingStatus(id, status);

      return res.json(updatedBooking);
    }

    // ====================
    // OWNER
    // Owner can update only bookings
    // belonging to their own halls
    // ====================

    if (user.role === "OWNER") {
      const hallOwner = await db.orm.public.HallOwner.where({
        userId: Number(user.userId),
      }).first();

      if (!hallOwner) {
        return res.status(403).json({
          message: "Hall owner profile not found",
        });
      }

      const hall = await db.orm.public.Hall.where({
        id: booking.hallId,
      }).first();

      if (!hall) {
        return res.status(404).json({
          message: "Hall not found",
        });
      }

      if (hall.ownerId !== hallOwner.id) {
        return res.status(403).json({
          message: "You can only update bookings for your own halls",
        });
      }

      const updatedBooking = await updateBookingStatus(id, status);

      return res.json(updatedBooking);
    }

    return res.status(403).json({
      message: "Access denied",
    });
  } catch (error) {
    console.error("Failed to update booking status:", error);

    return res.status(500).json({
      message: "Failed to update booking status",
    });
  }
}

// ====================
// Delete Booking
// DELETE /bookings/:id
// CUSTOMER → own booking only
// OWNER → own hall bookings only
// ADMIN → any booking
// ====================

export async function deleteBookingController(req: Request, res: Response) {
  try {
    const result = bookingIdParamSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const id = result.data.id;

    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const booking = await getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // ====================
    // ADMIN
    // ====================

    if (user.role === "ADMIN") {
      const deletedBooking = await deleteBooking(id);

      return res.json({
        message: "Booking deleted successfully",
        booking: deletedBooking,
      });
    }

    // ====================
    // CUSTOMER
    // ====================

    if (user.role === "CUSTOMER") {
      if (booking.userId !== Number(user.userId)) {
        return res.status(403).json({
          message: "You can only delete your own bookings",
        });
      }

      const deletedBooking = await deleteBooking(id);

      return res.json({
        message: "Booking deleted successfully",
        booking: deletedBooking,
      });
    }

    // ====================
    // OWNER
    // ====================

    if (user.role === "OWNER") {
      const hallOwner = await db.orm.public.HallOwner.where({
        userId: Number(user.userId),
      }).first();

      if (!hallOwner) {
        return res.status(403).json({
          message: "Hall owner profile not found",
        });
      }

      const hall = await db.orm.public.Hall.where({
        id: booking.hallId,
      }).first();

      if (!hall) {
        return res.status(404).json({
          message: "Hall not found",
        });
      }

      if (hall.ownerId !== hallOwner.id) {
        return res.status(403).json({
          message: "You can only delete bookings for your own halls",
        });
      }

      const deletedBooking = await deleteBooking(id);

      return res.json({
        message: "Booking deleted successfully",
        booking: deletedBooking,
      });
    }

    return res.status(403).json({
      message: "Access denied",
    });
  } catch (error) {
    console.error("Failed to delete booking:", error);

    return res.status(500).json({
      message: "Failed to delete booking",
    });
  }
}
