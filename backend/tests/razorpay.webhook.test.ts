import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createHmac, randomUUID } from "node:crypto";
import "temporal-polyfill/global";
import { Temporal } from "temporal-polyfill";

import app from "../src/app";
import { db } from "../src/db";
import { env } from "../src/config/env";

const TEST_WEBHOOK_SECRET = "webhook_test_secret_only_for_tests";
const originalWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

function configureWebhook() {
  Object.assign(env, {
    RAZORPAY_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
  });
}

function uniqueEventId(prefix: string) {
  return `evt_webhook_${prefix}_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

async function createConfirmedBooking() {
  return db.orm.public.Booking.create({
    userId: 11,
    hallId: 5,
    bookingDate: Temporal.Instant.from("2027-02-15T00:00:00Z"),
    startTime: "10:00",
    endTime: "18:00",
    guests: 100,
    totalAmount: "55000",
    status: "CONFIRMED",
  });
}

async function createPendingPayment(bookingId: number, orderId: string) {
  return db.orm.public.Payment.create({
    bookingId,
    amount: "55000",
    paymentMethod: "RAZORPAY",
    transactionId: orderId,
    status: "PENDING",
    paidAt: null,
  });
}

async function deleteWebhookEvent(eventId: string) {
  await db.orm.public.RazorpayWebhookEvent.where({ eventId }).delete();
}

async function deleteBooking(bookingId: number, eventId?: string) {
  await db.orm.public.Payment.where({ bookingId }).delete();
  await db.orm.public.Booking.where({ id: bookingId }).delete();

  if (eventId) await deleteWebhookEvent(eventId);
}

function createCapturedEvent(
  orderId: string,
  paymentId: string,
  amount = 5_500_000,
) {
  return {
    entity: "event",
    account_id: "acc_test",
    event: "payment.captured",
    contains: ["payment"],
    payload: {
      payment: {
        entity: {
          id: paymentId,
          entity: "payment",
          order_id: orderId,
          amount,
          currency: "INR",
          status: "captured",
          captured: true,
        },
      },
    },
    created_at: 1790000000,
  };
}

function createRawBody(payload: unknown): Buffer {
  return Buffer.from(JSON.stringify(payload), "utf8");
}

function signWebhook(rawBody: Buffer): string {
  return createHmac("sha256", TEST_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
}

function sendWebhook(rawBody: Buffer, signature: string, eventId: string) {
  return request(app)
    .post("/payments/razorpay/webhook")
    .set("Content-Type", "application/json")
    .set("x-razorpay-signature", signature)
    .set("x-razorpay-event-id", eventId)
    .send(rawBody.toString("utf8"));
}

afterEach(() => {
  Object.assign(env, {
    RAZORPAY_WEBHOOK_SECRET: originalWebhookSecret,
  });
});

describe("Razorpay Webhook API", () => {
  it("should mark a pending payment paid and persist the processed event", async () => {
    configureWebhook();

    const booking = await createConfirmedBooking();
    const orderId = `order_webhook_valid_${randomUUID()}`;
    const paymentId = `pay_webhook_valid_${randomUUID()}`;
    const eventId = uniqueEventId("valid");

    try {
      await createPendingPayment(booking.id, orderId);
      const rawBody = createRawBody(createCapturedEvent(orderId, paymentId));
      const response = await sendWebhook(
        rawBody,
        signWebhook(rawBody),
        eventId,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true, processed: true });

      const savedPayment = await db.orm.public.Payment.where({
        bookingId: booking.id,
      }).first();
      expect(savedPayment?.status).toBe("PAID");
      expect(savedPayment?.paymentMethod).toBe("RAZORPAY");
      expect(savedPayment?.transactionId).toBe(paymentId);
      expect(savedPayment?.paidAt).not.toBeNull();

      const savedEvent = await db.orm.public.RazorpayWebhookEvent.where({
        eventId,
      }).first();
      expect(savedEvent?.eventType).toBe("payment.captured");
      expect(savedEvent?.status).toBe("PROCESSED");
      expect(savedEvent?.processedAt).not.toBeNull();
      expect(savedEvent?.lastError).toBeNull();
    } finally {
      await deleteBooking(booking.id, eventId);
    }
  }, 15000);

  it("should reject an invalid signature without changing payment or saving an event", async () => {
    configureWebhook();

    const booking = await createConfirmedBooking();
    const orderId = `order_webhook_invalid_${randomUUID()}`;
    const paymentId = `pay_webhook_invalid_${randomUUID()}`;
    const eventId = uniqueEventId("invalid");

    try {
      await createPendingPayment(booking.id, orderId);
      const rawBody = createRawBody(createCapturedEvent(orderId, paymentId));
      const response = await sendWebhook(rawBody, "f".repeat(64), eventId);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid Razorpay webhook signature.");

      const savedPayment = await db.orm.public.Payment.where({
        bookingId: booking.id,
      }).first();
      expect(savedPayment?.status).toBe("PENDING");
      expect(savedPayment?.transactionId).toBe(orderId);

      const savedEvent = await db.orm.public.RazorpayWebhookEvent.where({
        eventId,
      }).first();
      expect(savedEvent).toBeNull();
    } finally {
      await deleteBooking(booking.id, eventId);
    }
  }, 15000);

  it("should persistently deduplicate a repeated captured webhook event", async () => {
    configureWebhook();

    const booking = await createConfirmedBooking();
    const orderId = `order_webhook_duplicate_${randomUUID()}`;
    const paymentId = `pay_webhook_duplicate_${randomUUID()}`;
    const eventId = uniqueEventId("duplicate");

    try {
      const originalPayment = await createPendingPayment(booking.id, orderId);
      const rawBody = createRawBody(createCapturedEvent(orderId, paymentId));
      const signature = signWebhook(rawBody);

      const firstResponse = await sendWebhook(rawBody, signature, eventId);
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body).toEqual({ received: true, processed: true });

      const secondResponse = await sendWebhook(rawBody, signature, eventId);
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body).toEqual({ received: true, duplicate: true });

      const savedPayment = await db.orm.public.Payment.where({
        bookingId: booking.id,
      }).first();
      expect(savedPayment?.id).toBe(originalPayment.id);
      expect(savedPayment?.status).toBe("PAID");
      expect(savedPayment?.transactionId).toBe(paymentId);

      const savedEvent = await db.orm.public.RazorpayWebhookEvent.where({
        eventId,
      }).first();
      expect(savedEvent?.status).toBe("PROCESSED");
    } finally {
      await deleteBooking(booking.id, eventId);
    }
  }, 15000);

  it("should not mark a payment paid when the webhook amount mismatches", async () => {
    configureWebhook();

    const booking = await createConfirmedBooking();
    const orderId = `order_webhook_amount_${randomUUID()}`;
    const paymentId = `pay_webhook_amount_${randomUUID()}`;
    const eventId = uniqueEventId("amount");

    try {
      await createPendingPayment(booking.id, orderId);
      const rawBody = createRawBody(
        createCapturedEvent(orderId, paymentId, 100),
      );
      const response = await sendWebhook(
        rawBody,
        signWebhook(rawBody),
        eventId,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true, ignored: true });

      const savedPayment = await db.orm.public.Payment.where({
        bookingId: booking.id,
      }).first();
      expect(savedPayment?.status).toBe("PENDING");
      expect(savedPayment?.transactionId).toBe(orderId);
      expect(savedPayment?.paidAt).toBeNull();

      const savedEvent = await db.orm.public.RazorpayWebhookEvent.where({
        eventId,
      }).first();
      expect(savedEvent?.status).toBe("PROCESSED");
      expect(savedEvent?.processedAt).not.toBeNull();
    } finally {
      await deleteBooking(booking.id, eventId);
    }
  }, 15000);

  it("should persist and deduplicate events that are not payment.captured", async () => {
    configureWebhook();

    const eventId = uniqueEventId("ignored");
    const rawBody = createRawBody({
      entity: "event",
      event: "payment.authorized",
      payload: {},
    });

    try {
      const firstResponse = await sendWebhook(
        rawBody,
        signWebhook(rawBody),
        eventId,
      );
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body).toEqual({ received: true, ignored: true });

      const secondResponse = await sendWebhook(
        rawBody,
        signWebhook(rawBody),
        eventId,
      );
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body).toEqual({ received: true, duplicate: true });

      const savedEvent = await db.orm.public.RazorpayWebhookEvent.where({
        eventId,
      }).first();
      expect(savedEvent?.eventType).toBe("payment.authorized");
      expect(savedEvent?.status).toBe("PROCESSED");
      expect(savedEvent?.processedAt).not.toBeNull();
    } finally {
      await deleteWebhookEvent(eventId);
    }
  }, 15000);
});
