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

    const { bookingId, paymentMethod } = req.body;

    if (!bookingId || !paymentMethod) {
      return res.status(400).json({
        message: "bookingId and paymentMethod are required",
      });
    }

    const booking = await db.orm.public.Booking.all();

    const selectedBooking = booking.find(
      (booking) => booking.id === Number(bookingId),
    );

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
    const existingPayment = await getPaymentByBookingId(Number(bookingId));

    if (existingPayment) {
      return res.status(409).json({
        message: "Payment already exists for this booking",
      });
    }

    // IMPORTANT:
    // Amount comes from booking, not from customer request
    const amount = selectedBooking.totalAmount.toString();

    const payment = await createPayment(
      Number(bookingId),
      amount,
      String(paymentMethod),
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

export async function getPaymentsController(req: Request, res: Response) {
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
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

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
      const bookings = await db.orm.public.Booking.all();

      const booking = bookings.find(
        (booking) => booking.id === payment.bookingId,
      );

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
    const bookingId = Number(req.params.bookingId);

    if (Number.isNaN(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

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

    const bookings = await db.orm.public.Booking.all();

    const booking = bookings.find((booking) => booking.id === bookingId);

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
      const hallOwners = await db.orm.public.HallOwner.all();

      const hallOwner = hallOwners.find(
        (hallOwner) => hallOwner.userId === Number(user.userId),
      );

      if (!hallOwner) {
        return res.status(403).json({
          message: "Hall owner profile not found",
        });
      }

      const halls = await db.orm.public.Hall.all();

      const hall = halls.find((hall) => hall.id === booking.hallId);

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
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const { status, transactionId } = req.body;

    const allowedStatuses = ["PAID", "FAILED", "REFUNDED"];

    if (!status || !allowedStatuses.includes(String(status))) {
      return res.status(400).json({
        message: "Invalid status. Allowed values: PAID, FAILED, REFUNDED",
      });
    }

    const payment = await getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    let paidAt: Temporal.Instant | null = null;

    if (String(status) === "PAID") {
      paidAt = Temporal.Now.instant();
    }

    const updatedPayment = await db.orm.public.Payment.where({
      id,
    }).update({
      status: String(status),
      transactionId:
        transactionId !== undefined
          ? String(transactionId)
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
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

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
