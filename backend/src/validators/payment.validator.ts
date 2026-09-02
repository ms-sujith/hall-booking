import { z } from "zod";

export const createPaymentSchema = z.object({
  bookingId: z.coerce
    .number()
    .int("bookingId must be a whole number")
    .positive("bookingId must be greater than 0"),

  paymentMethod: z
    .string()
    .trim()
    .min(2, "Payment method must be at least 2 characters")
    .max(50, "Payment method must not exceed 50 characters"),
});

export const paymentIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int("Payment ID must be a whole number")
    .positive("Payment ID must be greater than 0"),
});

export const paymentBookingIdParamSchema = z.object({
  bookingId: z.coerce
    .number()
    .int("Booking ID must be a whole number")
    .positive("Booking ID must be greater than 0"),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(["PAID", "FAILED", "REFUNDED"], {
    message: "Invalid status. Allowed values: PAID, FAILED, REFUNDED",
  }),

  transactionId: z
    .string()
    .trim()
    .max(255, "Transaction ID must not exceed 255 characters")
    .optional()
    .nullable(),
});
