import "temporal-polyfill/global";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { Temporal } from "temporal-polyfill";

import { env } from "../config/env";
import { db } from "../db";

const STALE_PROCESSING_AFTER_MS = 2 * 60 * 1000;

type EventClaimResult = "claimed" | "duplicate" | "busy" | "missing";

type WebhookOutcome = {
  received: true;
  processed?: true;
  duplicate?: true;
  ignored?: true;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function amountToPaise(amount: string): number {
  const normalizedAmount = amount.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
    throw new Error("Invalid INR amount.");
  }

  const [rupees, fraction = ""] = normalizedAmount.split(".");
  const paise = Number(rupees) * 100 + Number((fraction + "00").slice(0, 2));

  if (!Number.isSafeInteger(paise) || paise <= 0) {
    throw new Error("Invalid INR amount.");
  }

  return paise;
}

function isUniqueConstraintError(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && isRecord(current); depth += 1) {
    if (
      current.sqlState === "23505" ||
      current.code === "23505" ||
      current.code === "P2002"
    ) {
      return true;
    }

    current = current.cause;
  }

  return false;
}

function isStale(receivedAt: unknown): boolean {
  const dateText =
    receivedAt instanceof Date
      ? receivedAt.toISOString()
      : String(receivedAt ?? "");
  const receivedAtMs = Date.parse(dateText);

  // If the timestamp cannot be interpreted, allow recovery instead of leaving
  // the event permanently stuck in PROCESSING.
  return (
    !Number.isFinite(receivedAtMs) ||
    Date.now() - receivedAtMs >= STALE_PROCESSING_AFTER_MS
  );
}

async function claimExistingEvent(
  eventId: string,
  eventType: string,
): Promise<EventClaimResult> {
  const existing = await db.orm.public.RazorpayWebhookEvent.where({
    eventId,
  }).first();

  if (!existing) return "missing";
  if (existing.status === "PROCESSED") return "duplicate";

  if (
    (existing.status === "PROCESSING" || existing.status === "RECEIVED") &&
    !isStale(existing.receivedAt)
  ) {
    return "busy";
  }

  // Retry FAILED events and recover abandoned RECEIVED/PROCESSING records.
  await db.orm.public.RazorpayWebhookEvent.where({ eventId }).update({
    eventType,
    status: "PROCESSING",
    receivedAt: Temporal.Now.instant(),
    processedAt: null,
    lastError: null,
  });

  return "claimed";
}

async function claimEvent(
  eventId: string,
  eventType: string,
): Promise<EventClaimResult> {
  const existing = await db.orm.public.RazorpayWebhookEvent.where({
    eventId,
  }).first();

  if (existing) return claimExistingEvent(eventId, eventType);

  try {
    await db.orm.public.RazorpayWebhookEvent.create({
      eventId,
      eventType,
      status: "PROCESSING",
      receivedAt: Temporal.Now.instant(),
      processedAt: null,
      lastError: null,
    });

    return "claimed";
  } catch (error) {
    // The unique eventId constraint arbitrates simultaneous first deliveries.
    if (!isUniqueConstraintError(error)) throw error;

    const result = await claimExistingEvent(eventId, eventType);
    if (result === "missing") throw error;
    return result;
  }
}

async function markEventProcessed(eventId: string): Promise<void> {
  await db.orm.public.RazorpayWebhookEvent.where({ eventId }).update({
    status: "PROCESSED",
    processedAt: Temporal.Now.instant(),
    lastError: null,
  });
}

async function markEventFailed(eventId: string, reason: string): Promise<void> {
  await db.orm.public.RazorpayWebhookEvent.where({ eventId }).update({
    status: "FAILED",
    processedAt: null,
    lastError: reason.slice(0, 500),
  });
}

async function finishIgnoredEvent(
  res: Response,
  eventId: string,
  outcome: WebhookOutcome = { received: true, ignored: true },
) {
  await markEventProcessed(eventId);
  return res.status(200).json(outcome);
}

/**
 * POST /payments/razorpay/webhook
 *
 * The route must use express.raw() before express.json() so the signature
 * is checked against the original request bytes. Event IDs are persisted in
 * RazorpayWebhookEvent to make delivery handling durable across restarts.
 */
export async function razorpayWebhookController(req: Request, res: Response) {
  const eventIdHeader = req.get("x-razorpay-event-id")?.trim();
  let claimedEventId: string | undefined;

  try {
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Razorpay webhook secret is not configured.");
      return res.status(500).json({
        message: "Razorpay webhook is not configured.",
      });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        message: "Expected a raw webhook request body.",
      });
    }

    const rawBody = req.body as Buffer;
    const signature = req.get("x-razorpay-signature");

    if (!signature || !/^[a-fA-F0-9]{64}$/.test(signature)) {
      return res.status(400).json({
        message: "Missing or invalid Razorpay webhook signature.",
      });
    }

    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest();
    const receivedSignature = Buffer.from(signature, "hex");
    const signatureIsValid =
      expectedSignature.length === receivedSignature.length &&
      timingSafeEqual(expectedSignature, receivedSignature);

    if (!signatureIsValid) {
      console.warn("Rejected Razorpay webhook with invalid signature.");
      return res.status(400).json({
        message: "Invalid Razorpay webhook signature.",
      });
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody.toString("utf8")) as unknown;
    } catch {
      return res.status(400).json({ message: "Invalid webhook JSON." });
    }

    if (
      !isRecord(parsedBody) ||
      typeof parsedBody.event !== "string" ||
      !parsedBody.event.trim()
    ) {
      return res.status(400).json({
        message: "Invalid Razorpay webhook payload.",
      });
    }

    if (
      !eventIdHeader ||
      eventIdHeader.length > 255 ||
      /[\r\n]/.test(eventIdHeader)
    ) {
      return res.status(400).json({
        message: "Missing or invalid Razorpay webhook event ID.",
      });
    }

    const eventId = eventIdHeader;
    const eventType = parsedBody.event;
    const claimResult = await claimEvent(eventId, eventType);

    if (claimResult === "duplicate") {
      return res.status(200).json({ received: true, duplicate: true });
    }

    if (claimResult === "busy") {
      // Ask the provider to retry instead of acknowledging an event whose
      // first delivery is still being processed by another request.
      return res.status(500).json({
        message: "Razorpay webhook event is already being processed.",
      });
    }

    if (claimResult === "missing") {
      return res.status(500).json({
        message: "Unable to claim Razorpay webhook event.",
      });
    }

    claimedEventId = eventId;

    if (eventType !== "payment.captured") {
      await markEventProcessed(eventId);
      claimedEventId = undefined;
      return res.status(200).json({ received: true, ignored: true });
    }

    const payload = isRecord(parsedBody.payload) ? parsedBody.payload : null;
    const paymentPayload =
      payload && isRecord(payload.payment) ? payload.payment : null;
    const paymentEntity =
      paymentPayload && isRecord(paymentPayload.entity)
        ? paymentPayload.entity
        : null;

    if (!paymentEntity) {
      await markEventFailed(
        eventId,
        "Missing payment entity in webhook payload.",
      );
      claimedEventId = undefined;
      return res.status(400).json({
        message: "Missing payment entity in webhook payload.",
      });
    }

    const paymentId = paymentEntity.id;
    const orderId = paymentEntity.order_id;
    const amount = paymentEntity.amount;
    const currency = paymentEntity.currency;
    const paymentStatus = paymentEntity.status;

    if (
      typeof paymentId !== "string" ||
      !paymentId.startsWith("pay_") ||
      typeof orderId !== "string" ||
      !orderId.startsWith("order_") ||
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      currency !== "INR" ||
      paymentStatus !== "captured"
    ) {
      await markEventFailed(eventId, "Invalid captured-payment details.");
      claimedEventId = undefined;
      return res.status(400).json({
        message: "Invalid captured-payment details.",
      });
    }

    // Frontend verification or an earlier event may already have captured it.
    const paymentAlreadyCaptured = await db.orm.public.Payment.where({
      transactionId: paymentId,
    }).first();

    if (paymentAlreadyCaptured) {
      if (
        paymentAlreadyCaptured.status === "PAID" &&
        paymentAlreadyCaptured.paymentMethod === "RAZORPAY"
      ) {
        await markEventProcessed(eventId);
        claimedEventId = undefined;
        return res.status(200).json({ received: true, duplicate: true });
      }

      return await finishIgnoredEvent(res, eventId);
    }

    // Before frontend verification, transactionId stores the Razorpay order ID.
    const payment = await db.orm.public.Payment.where({
      transactionId: orderId,
    }).first();

    if (!payment) {
      console.warn(
        `Webhook ${eventId}: no local payment record for order ${orderId}; requesting retry.`,
      );
      await markEventFailed(
        eventId,
        "No local payment record for the Razorpay order.",
      );
      claimedEventId = undefined;
      return res.status(500).json({
        message: "Local payment record not found for Razorpay order.",
      });
    }

    if (payment.paymentMethod !== "RAZORPAY") {
      console.warn(
        `Webhook ${eventId}: payment method does not match Razorpay.`,
      );
      return await finishIgnoredEvent(res, eventId);
    }

    if (payment.status === "PAID") {
      return await finishIgnoredEvent(res, eventId);
    }

    if (payment.status !== "PENDING") {
      console.warn(
        `Webhook ${eventId}: payment has unexpected status ${payment.status}.`,
      );
      return await finishIgnoredEvent(res, eventId);
    }

    const booking = await db.orm.public.Booking.where({
      id: payment.bookingId,
    }).first();

    if (!booking) {
      console.error(
        `Webhook ${eventId}: booking ${payment.bookingId} was not found; requesting retry.`,
      );
      await markEventFailed(
        eventId,
        "Booking for the local payment was not found.",
      );
      claimedEventId = undefined;
      return res.status(500).json({
        message: "Booking for Razorpay payment was not found.",
      });
    }

    const expectedBookingAmount = amountToPaise(booking.totalAmount.toString());
    const savedPaymentAmount = amountToPaise(payment.amount.toString());

    if (amount !== expectedBookingAmount || amount !== savedPaymentAmount) {
      console.error(
        `Webhook ${eventId}: amount mismatch for booking ${booking.id}.`,
      );
      return await finishIgnoredEvent(res, eventId);
    }

    // Only update the existing payment row; never create a payment here.
    await db.orm.public.Payment.where({
      id: payment.id,
      status: "PENDING",
      transactionId: orderId,
    }).update({
      status: "PAID",
      transactionId: paymentId,
      paidAt: Temporal.Now.instant(),
    });

    // Re-read to check whether our conditional update actually won a race
    // against frontend verification or a different webhook delivery.
    const savedPayment = await db.orm.public.Payment.where({
      id: payment.id,
    }).first();

    if (
      savedPayment?.status !== "PAID" ||
      savedPayment?.transactionId !== paymentId
    ) {
      await markEventFailed(
        eventId,
        "Payment state changed before webhook update completed.",
      );
      claimedEventId = undefined;
      return res.status(500).json({
        message: "Payment state changed during webhook processing.",
      });
    }

    await markEventProcessed(eventId);
    claimedEventId = undefined;

    console.info(
      `Webhook ${eventId}: payment captured for booking ${booking.id}.`,
    );
    return res.status(200).json({ received: true, processed: true });
  } catch (error) {
    if (claimedEventId) {
      try {
        await markEventFailed(
          claimedEventId,
          "Unexpected error while processing the Razorpay webhook.",
        );
      } catch (markError) {
        console.error(
          "Unable to mark Razorpay webhook event as FAILED:",
          markError,
        );
      }
    }

    const safeEventId =
      eventIdHeader && eventIdHeader.length <= 255 ? eventIdHeader : "unknown";
    console.error(
      `Razorpay webhook processing failed for event ${safeEventId}:`,
      error,
    );

    return res.status(500).json({
      message: "Unable to process Razorpay webhook.",
    });
  }
}
