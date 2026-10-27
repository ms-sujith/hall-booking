import "temporal-polyfill/global";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import Razorpay from "razorpay";
import { Temporal } from "temporal-polyfill";
import { z } from "zod";

import { env } from "../config/env";
import { db } from "../db";

const bookingIdSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
});

const verifyPaymentSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/, "Invalid Razorpay signature format"),
});

function getRazorpayClient(): Razorpay {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Set the backend Razorpay environment variables.",
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function amountToPaise(amount: string): number {
  const normalizedAmount = amount.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
    throw new Error(
      "Booking amount must be a valid INR amount with at most two decimal places.",
    );
  }

  const [rupees, fraction = ""] = normalizedAmount.split(".");
  const paise = Number(rupees) * 100 + Number((fraction + "00").slice(0, 2));

  if (!Number.isSafeInteger(paise) || paise <= 0) {
    throw new Error("Booking amount is invalid.");
  }

  return paise;
}

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = env.RAZORPAY_KEY_SECRET;

  if (!secret || !/^[a-fA-F0-9]{64}$/.test(signature)) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest();

  const receivedSignature = Buffer.from(signature, "hex");

  return (
    expectedSignature.length === receivedSignature.length &&
    timingSafeEqual(expectedSignature, receivedSignature)
  );
}

/**
 * POST /payments/razorpay/order
 * Creates or reuses a Razorpay order for the authenticated
 * customer's confirmed booking.
 */
export async function createRazorpayOrderController(
  req: Request,
  res: Response,
) {
  try {
    const user = (req as any).user;
    const parsed = bookingIdSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid booking ID.",
        errors: parsed.error.flatten(),
      });
    }

    const bookingId = parsed.data.bookingId;

    const booking = await db.orm.public.Booking.where({
      id: bookingId,
    }).first();

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    if (booking.userId !== Number(user.userId)) {
      return res.status(403).json({
        message: "You cannot pay for another customer's booking.",
      });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        message: "Only confirmed bookings can be paid for.",
      });
    }

    const amount = booking.totalAmount.toString();
    const amountInPaise = amountToPaise(amount);
    const razorpay = getRazorpayClient();

    const existingPayment = await db.orm.public.Payment.where({
      bookingId,
    }).first();

    if (existingPayment) {
      // Never initiate another checkout for an already-paid booking.
      if (existingPayment.status === "PAID") {
        return res.status(409).json({
          message: "This booking has already been paid for.",
          status: "PAID",
        });
      }

      // Reuse a Razorpay order if one is already associated
      // with this pending payment record.
      if (
        existingPayment.status === "PENDING" &&
        existingPayment.paymentMethod === "RAZORPAY" &&
        typeof existingPayment.transactionId === "string" &&
        existingPayment.transactionId.startsWith("order_")
      ) {
        return res.status(200).json({
          message: "Existing Razorpay order reused.",
          keyId: env.RAZORPAY_KEY_ID,
          orderId: existingPayment.transactionId,
          amount: amountInPaise,
          currency: "INR",
          bookingId,
          paymentId: existingPayment.id,
        });
      }

      // Legacy pending records may have a method such as UPI
      // and no transaction ID. They can be linked to Razorpay
      // without inserting a second payment record.
      const canReusePendingPayment =
        existingPayment.status === "PENDING" &&
        existingPayment.transactionId === null;

      if (!canReusePendingPayment) {
        return res.status(409).json({
          message:
            "A payment record already exists for this booking. Please check its status before trying again.",
          status: existingPayment.status,
        });
      }
    }

    // Create a Razorpay order only after checking the saved payment.
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `booking_${bookingId}_${Date.now()}`,
      notes: {
        bookingId: String(bookingId),
        customerId: String(user.userId),
      },
    });

    if (existingPayment) {
      // Link the legacy pending record to the new Razorpay order.
      // Reuse the existing payment ID instead of creating a duplicate.
      await db.orm.public.Payment.where({
        id: existingPayment.id,
      }).update({
        amount,
        paymentMethod: "RAZORPAY",
        transactionId: order.id,
        status: "PENDING",
        paidAt: null,
      });

      return res.status(200).json({
        message: "Existing pending payment linked to Razorpay.",
        keyId: env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: amountInPaise,
        currency: "INR",
        bookingId,
        paymentId: existingPayment.id,
      });
    }

    // No payment exists, so create a new pending payment record.
    const payment = await db.orm.public.Payment.create({
      bookingId,
      amount,
      paymentMethod: "RAZORPAY",
      transactionId: order.id,
      status: "PENDING",
      paidAt: null,
    });

    return res.status(201).json({
      message: "Razorpay order created.",
      keyId: env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      bookingId,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);

    return res.status(500).json({
      message: "Unable to create the Razorpay order.",
    });
  }
}

/**
 * POST /payments/razorpay/verify
 * Verifies the payment signature and independently checks
 * Razorpay's API before marking the payment as PAID.
 */
export async function verifyRazorpayPaymentController(
  req: Request,
  res: Response,
) {
  try {
    const user = (req as any).user;
    const parsed = verifyPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid payment verification details.",
        errors: parsed.error.flatten(),
      });
    }

    const {
      bookingId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = parsed.data;

    const booking = await db.orm.public.Booking.where({
      id: bookingId,
    }).first();

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    if (booking.userId !== Number(user.userId)) {
      return res.status(403).json({
        message: "You cannot verify another customer's booking.",
      });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        message: "The booking is not confirmed.",
      });
    }

    if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
      return res.status(400).json({
        message: "Razorpay payment signature verification failed.",
      });
    }

    const payment = await db.orm.public.Payment.where({
      bookingId,
    }).first();

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found for this booking.",
      });
    }

    // Pending payments must match the Razorpay order stored
    // against this booking's payment record.
    if (payment.status !== "PAID" && payment.transactionId !== orderId) {
      return res.status(400).json({
        message: "The Razorpay order does not match this booking's payment.",
      });
    }

    // Verify the payment directly with Razorpay's server-side API.
    const razorpay = getRazorpayClient();
    const razorpayPayment = await razorpay.payments.fetch(paymentId);
    const expectedAmount = amountToPaise(booking.totalAmount.toString());

    const paymentMatchesBooking =
      razorpayPayment.id === paymentId &&
      razorpayPayment.order_id === orderId &&
      razorpayPayment.amount === expectedAmount &&
      razorpayPayment.currency === "INR";

    if (
      !paymentMatchesBooking ||
      razorpayPayment.status !== "captured" ||
      razorpayPayment.captured !== true
    ) {
      return res.status(400).json({
        message:
          "Razorpay has not confirmed a captured payment matching this booking's amount and order.",
      });
    }

    // Make verification retries idempotent.
    if (payment.status === "PAID") {
      if (payment.transactionId === paymentId) {
        return res.status(200).json({
          message: "Payment has already been verified.",
          status: "PAID",
        });
      }

      return res.status(409).json({
        message: "This booking has already been paid for.",
      });
    }

    const updatedPayment = await db.orm.public.Payment.where({
      id: payment.id,
    }).update({
      status: "PAID",
      transactionId: paymentId,
      paidAt: Temporal.Now.instant(),
    });

    return res.status(200).json({
      message: "Payment verified successfully.",
      status: "PAID",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);

    return res.status(500).json({
      message: "Unable to verify the Razorpay payment.",
    });
  }
}
