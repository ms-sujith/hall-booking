import { z } from "zod";

export const createBookingSchema = z.object({
  hallId: z.coerce
    .number()
    .int("hallId must be a whole number")
    .positive("hallId must be greater than 0"),

  bookingDate: z
    .string()
    .trim()
    .min(1, "Booking date is required"),

  startTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format. Use HH:MM"),

  endTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format. Use HH:MM")
    .optional()
    .nullable(),

  guests: z.coerce
    .number()
    .int("Guests must be a whole number")
    .positive("Guests must be greater than 0"),
});

export const bookingIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int("Booking ID must be a whole number")
    .positive("Booking ID must be greater than 0"),
});

export const hallIdParamSchema = z.object({
  hallId: z.coerce
    .number()
    .int("Hall ID must be a whole number")
    .positive("Hall ID must be greater than 0"),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "REJECTED", "CANCELLED"], {
    message: "Invalid status. Allowed values: CONFIRMED, REJECTED, CANCELLED",
  }),
});
