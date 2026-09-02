import "temporal-polyfill/global";
import { Temporal } from "temporal-polyfill";
import type { Request, Response } from "express";

import {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentByBookingId,
  getPaymentsByUserId,
  updatePaymentStatus,
  deletePayment,
} from "../services/payment.service";

import { db } from "../db";

import {
  createPaymentSchema,
  paymentIdParamSchema,
  paymentBookingIdParamSchema,
  updatePaymentStatusSchema,
} from "../validators/payment.validator";

// ====================
// Create Payment
// POST /payments
// CUSTOMER only
// ====================

export async function createPaymentController(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result = createPaymentSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { bookingId, paymentMethod } = result.data;

    const selectedBooking = await db.orm.public.Booking.where({
      id: bookingId,
    }).first();

    if (!selectedBooking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Customer can only pay for their own booking
    if (selectedBooking.userId !== Number(user.userId)) {
      return res.status(403).json({
        message: "You can only make payment for your own booking",
      });
    }

    // Payment allowed only for confirmed bookings
    if (selectedBooking.status !== "CONFIRMED") {
      return res.status(400).json({
        message: "Payment is allowed only for confirmed bookings",
      });
    }

    // One payment per booking
    const existingPayment = await getPaymentByBookingId(bookingId);

    if (existingPayment) {
      return res.status(409).json({
        message: "Payment already exists for this booking",
      });
    }

    // IMPORTANT:
    // Amount comes from booking, not from customer request
    const amount = selectedBooking.totalAmount.toString();

    const payment = await createPayment(
      bookingId,
      amount,
      paymentMethod,
      null,
      "PENDING",
      null,
    );

    console.log("Payment created successfully!");

    return res.status(201).json(payment);
  } catch (error) {
    console.error("Failed to create payment:", error);

    return res.status(500).json({
      message: "Failed to create payment",
    });
  }
}

// ====================
// Get All Payments
// GET /payments
// ADMIN only
// ====================

export async function getPaymentsController(_req: Request, res: Response) {
  try {
    const payments = await getPayments();

    return res.json(payments);
  } catch (error) {
    console.error("Failed to fetch payments:", error);

    return res.status(500).json({
      message: "Failed to fetch payments",
    });
  }
}

// ====================
// Get My Payments
// GET /payments/my
// CUSTOMER only
// ====================

export async function getMyPaymentsController(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const payments = await getPaymentsByUserId(Number(user.userId));

    return res.json(payments);
  } catch (error) {
    console.error("Failed to fetch user payments:", error);

    return res.status(500).json({
      message: "Failed to fetch user payments",
    });
  }
}

// ====================
// Get Payment By ID
// GET /payments/:id
// CUSTOMER / ADMIN
// ====================

export async function getPaymentByIdController(req: Request, res: Response) {
  try {
    const result = paymentIdParamSchema.safeParse(req.params);

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

    const payment = await getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // ADMIN can view any payment
    if (user.role === "ADMIN") {
      return res.json(payment);
    }

    // CUSTOMER can view only their own payment
    if (user.role === "CUSTOMER") {
      const booking = await db.orm.public.Booking.where({
        id: payment.bookingId,
      }).first();

      if (!booking) {
        return res.status(404).json({
          message: "Booking not found",
        });
      }

      if (booking.userId !== Number(user.userId)) {
        return res.status(403).json({
          message: "You can only view your own payments",
        });
      }

      return res.json(payment);
    }

    return res.status(403).json({
      message: "Access denied",
    });
  } catch (error) {
    console.error("Failed to fetch payment:", error);

    return res.status(500).json({
      message: "Failed to fetch payment",
    });
  }
}

// ====================
// Get Payment By Booking
// GET /payments/booking/:bookingId
// CUSTOMER / OWNER / ADMIN
// ====================

export async function getPaymentByBookingController(
  req: Request,
  res: Response,
) {
  try {
    const result = paymentBookingIdParamSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const bookingId = result.data.bookingId;

    const payment = await getPaymentByBookingId(bookingId);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (user.role === "ADMIN") {
      return res.json(payment);
    }

    const booking = await db.orm.public.Booking.where({
      id: bookingId,
    }).first();

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // CUSTOMER → own booking
    if (user.role === "CUSTOMER") {
      if (booking.userId !== Number(user.userId)) {
        return res.status(403).json({
          message: "You can only view your own payment",
        });
      }

      return res.json(payment);
    }

    // OWNER → booking belonging to their hall
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

      if (!hall || hall.ownerId !== hallOwner.id) {
        return res.status(403).json({
          message: "You can only view payments for your own halls",
        });
      }

      return res.json(payment);
    }

    return res.status(403).json({
      message: "Access denied",
    });
  } catch (error) {
    console.error("Failed to fetch booking payment:", error);

    return res.status(500).json({
      message: "Failed to fetch booking payment",
    });
  }
}

// ====================
// Update Payment Status
// PATCH /payments/:id/status
// ADMIN only
// ====================

export async function updatePaymentStatusController(
  req: Request,
  res: Response,
) {
  try {
    const idResult = paymentIdParamSchema.safeParse(req.params);

    if (!idResult.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: idResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const statusResult = updatePaymentStatusSchema.safeParse(req.body);

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
    const { status, transactionId } = statusResult.data;

    const payment = await getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    let paidAt: Temporal.Instant | null = null;

    if (status === "PAID") {
      paidAt = Temporal.Now.instant();
    }

    const updatedPayment = await db.orm.public.Payment.where({
      id,
    }).update({
      status,
      transactionId:
        transactionId !== undefined
          ? transactionId
          : payment.transactionId,
      paidAt,
    });

    return res.json(updatedPayment);
  } catch (error) {
    console.error("Failed to update payment status:", error);

    return res.status(500).json({
      message: "Failed to update payment status",
    });
  }
}

// ====================
// Delete Payment
// DELETE /payments/:id
// ADMIN only
// ====================

export async function deletePaymentController(req: Request, res: Response) {
  try {
    const result = paymentIdParamSchema.safeParse(req.params);

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

    const payment = await getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const deletedPayment = await deletePayment(id);

    return res.json({
      message: "Payment deleted successfully",
      payment: deletedPayment,
    });
  } catch (error) {
    console.error("Failed to delete payment:", error);

    return res.status(500).json({
      message: "Failed to delete payment",
    });
  }
}