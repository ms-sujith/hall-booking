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

type RazorpayOrderSnapshot = {
  id: string;
  amount: number;
  amount_paid?: number;
  currency: string;
  status: string;
  notes?: Record<string, unknown> | null;
};

type RazorpayOrderPaymentsSnapshot = {
  items?: Array<{ status?: string }>;
};

type RazorpayApiError = {
  statusCode?: number;
  error?: {
    code?: string;
    description?: string;
  };
  message?: string;
  response?: {
    status?: number;
    data?: {
      error?: {
        code?: string;
        description?: string;
      };
    };
  };
};

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
 * Razorpay returns a BAD_REQUEST_ERROR with a message similar to
 * "The id provided does not exist" when an order ID is not present
 * in the account/environment associated with the configured API keys.
 * Only treat that specific response as a stale/cross-environment order.
 */
function isRazorpayOrderNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as RazorpayApiError;
  const statusCode = Number(
    candidate.statusCode ?? candidate.response?.status ?? 0,
  );
  const errorCode = (
    candidate.error?.code ??
    candidate.response?.data?.error?.code ??
    ""
  ).toUpperCase();
  const description = [
    candidate.error?.description,
    candidate.response?.data?.error?.description,
    candidate.message,
  ]
    .filter((part): part is string => typeof part === "string")
    .join(" ")
    .toLowerCase();

  const isNotFoundStatus =
    statusCode === 404 ||
    (statusCode === 400 && errorCode === "BAD_REQUEST_ERROR");
  const hasNotFoundMessage =
    description.includes("does not exist") || description.includes("not found");

  return isNotFoundStatus && hasNotFoundMessage;
}

/**
 * POST /payments/razorpay/order
 * Creates a Razorpay order for the authenticated customer's confirmed booking.
 * A saved order is reused only after Razorpay confirms it using the currently
 * configured API credentials. This prevents a Test Mode order from being sent
 * to Checkout with a Live Mode key (or vice versa).
 */
export async function createRazorpayOrderController(
  req: Request,
  res: Response,
) {
  try {
    const user = (req as any).user;

    if (!user?.userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

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
      return res.status(404).json({ message: "Booking not found." });
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

    if (existingPayment?.status === "PAID") {
      return res.status(409).json({
        message: "This booking has already been paid for.",
        status: "PAID",
      });
    }

    if (existingPayment) {
      const hasSavedRazorpayOrder =
        existingPayment.status === "PENDING" &&
        existingPayment.paymentMethod === "RAZORPAY" &&
        typeof existingPayment.transactionId === "string" &&
        existingPayment.transactionId.startsWith("order_");

      if (hasSavedRazorpayOrder) {
        let savedOrderNotFoundInCurrentEnvironment = false;

        try {
          const savedOrder = (await razorpay.orders.fetch(
            existingPayment.transactionId as string,
          )) as unknown as RazorpayOrderSnapshot;

          const notes = savedOrder.notes ?? {};
          const orderBelongsToBooking =
            notes.bookingId === String(bookingId) &&
            notes.customerId === String(user.userId);

          const orderMatchesBooking =
            savedOrder.id === existingPayment.transactionId &&
            savedOrder.amount === amountInPaise &&
            savedOrder.currency === "INR" &&
            orderBelongsToBooking;

          if (!orderMatchesBooking) {
            return res.status(409).json({
              message:
                "The saved Razorpay order does not match this booking. Payment has not been started. Please contact support.",
            });
          }

          if (
            savedOrder.status === "paid" ||
            Number(savedOrder.amount_paid ?? 0) > 0
          ) {
            return res.status(409).json({
              message:
                "The saved Razorpay order has payment activity. Refresh the payment status before trying again.",
            });
          }

          if (
            savedOrder.status !== "created" &&
            savedOrder.status !== "attempted"
          ) {
            return res.status(409).json({
              message:
                "The saved Razorpay order is not available for another payment attempt. Please contact support.",
            });
          }

          // An attempted order can contain an authorized payment even when
          // amount_paid is zero. Only reuse it if all previous attempts failed
          // or there are no payment attempts recorded.
          if (savedOrder.status === "attempted") {
            const paymentCollection = (await razorpay.orders.fetchPayments(
              savedOrder.id,
            )) as unknown as RazorpayOrderPaymentsSnapshot;

            if (!Array.isArray(paymentCollection.items)) {
              return res.status(502).json({
                message:
                  "Unable to inspect previous attempts for the saved Razorpay order. Please retry shortly.",
              });
            }

            const hasUnresolvedAttempt = paymentCollection.items.some(
              (item) => {
                const paymentStatus = (item.status ?? "").toLowerCase();
                return (
                  paymentStatus !== "failed" && paymentStatus !== "refunded"
                );
              },
            );

            if (hasUnresolvedAttempt) {
              return res.status(409).json({
                message:
                  "The saved Razorpay order has a payment attempt that is not marked failed. Please contact support before retrying.",
              });
            }
          }

          return res.status(200).json({
            message: "Verified existing Razorpay order reused.",
            keyId: env.RAZORPAY_KEY_ID,
            orderId: savedOrder.id,
            amount: amountInPaise,
            currency: "INR",
            bookingId,
            paymentId: existingPayment.id,
          });
        } catch (error) {
          if (!isRazorpayOrderNotFound(error)) {
            console.error("Failed to verify existing Razorpay order:", error);
            return res.status(502).json({
              message:
                "Unable to verify the existing Razorpay order. No new order was created. Please retry shortly.",
            });
          }

          // The saved order is not available under the currently configured
          // credentials. Create a new order in the active Razorpay environment.
          savedOrderNotFoundInCurrentEnvironment = true;
          console.warn(
            `Saved Razorpay order was not found in the configured environment for booking ${bookingId}; creating a replacement order.`,
          );
        }

        if (!savedOrderNotFoundInCurrentEnvironment) {
          return res.status(409).json({
            message:
              "The existing Razorpay order could not be safely reused. Please contact support.",
          });
        }
      }

      const canLinkPendingPayment =
        existingPayment.status === "PENDING" &&
        (existingPayment.transactionId === null ||
          (existingPayment.paymentMethod === "RAZORPAY" &&
            typeof existingPayment.transactionId === "string" &&
            existingPayment.transactionId.startsWith("order_")));

      if (!canLinkPendingPayment) {
        return res.status(409).json({
          message:
            "A payment record already exists for this booking. Please check its status before trying again.",
          status: existingPayment.status,
        });
      }
    }

    // Create an order only when there is no saved order in this environment
    // or the saved order was confirmed missing under the current credentials.
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
        message: "Fresh Razorpay order created for existing payment record.",
        keyId: env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: amountInPaise,
        currency: "INR",
        bookingId,
        paymentId: existingPayment.id,
      });
    }

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
 * Verifies the Razorpay signature and independently fetches the payment
 * from Razorpay before marking the booking payment as PAID.
 */
export async function verifyRazorpayPaymentController(
  req: Request,
  res: Response,
) {
  try {
    const user = (req as any).user;

    if (!user?.userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

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
      return res.status(404).json({ message: "Booking not found." });
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

    // For a pending payment, the order ID must match the order currently
    // associated with this booking. A webhook may already have marked it
    // PAID and replaced transactionId with the Razorpay payment ID.
    if (payment.status !== "PAID" && payment.transactionId !== orderId) {
      return res.status(400).json({
        message: "The Razorpay order does not match this booking's payment.",
      });
    }

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

    // Make verification retries idempotent, including when the webhook
    // marked this exact Razorpay payment as PAID first.
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
