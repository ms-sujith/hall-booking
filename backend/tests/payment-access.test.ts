import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";
import { db } from "../src/db";
import "temporal-polyfill/global";
import { Temporal } from "temporal-polyfill";

let customerToken: string;
let ownerToken: string;
let adminToken: string;

let temporaryBookingId: number;
let temporaryPaymentId: number;

async function getToken(email: string, password: string) {
  const response = await request(app).post("/auth/login").send({
    email,
    password,
  });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeTypeOf("string");

  return response.body.token as string;
}

async function createTemporaryPayment() {
  const booking = await db.orm.public.Booking.create({
    userId: 11,
    hallId: 5,
    bookingDate: Temporal.Instant.from("2027-02-15T00:00:00Z"),
    startTime: "10:00",
    endTime: "18:00",
    guests: 100,
    totalAmount: "55000",
    status: "CONFIRMED",
  });

  temporaryBookingId = booking.id;

  const payment = await db.orm.public.Payment.create({
    bookingId: booking.id,
    amount: "55000",
    paymentMethod: "UPI",
    transactionId: null,
    status: "PENDING",
    paidAt: null,
  });

  temporaryPaymentId = payment.id;

  return payment;
}

beforeAll(async () => {
  customerToken = await getToken("suresh@test.com", "Suresh@123");

  ownerToken = await getToken("owner@test.com", "Owner@123");

  adminToken = await getToken("admin@test.com", "Marjanahalli@123");
});

afterAll(async () => {
  if (temporaryPaymentId) {
    await db.orm.public.Payment.where({
      id: temporaryPaymentId,
    }).delete();
  }

  if (temporaryBookingId) {
    await db.orm.public.Booking.where({
      id: temporaryBookingId,
    }).delete();
  }
});

describe("Payment Access API", () => {
  it("should allow an admin to get all payments", async () => {
    const response = await request(app)
      .get("/payments")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should reject a customer from getting all payments", async () => {
    const response = await request(app)
      .get("/payments")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  it("should allow a customer to get their own payments", async () => {
    const response = await request(app)
      .get("/payments/my")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);

    expect(
      response.body.some((payment: { id: number }) => payment.id === 1),
    ).toBe(true);
  });

  it("should reject an owner from getting customer payment list", async () => {
    const response = await request(app)
      .get("/payments/my")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  it("should allow a customer to view their own payment by ID", async () => {
    const response = await request(app)
      .get("/payments/1")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      bookingId: 1,
      amount: "55000",
      status: "REFUNDED",
    });
  });

  it("should allow an admin to view any payment by ID", async () => {
    const response = await request(app)
      .get("/payments/1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  it("should reject an owner from viewing payment by ID", async () => {
    const response = await request(app)
      .get("/payments/1")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  it("should reject an invalid payment ID", async () => {
    const response = await request(app)
      .get("/payments/abc")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should return 404 for a non-existent payment", async () => {
    const response = await request(app)
      .get("/payments/999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Payment not found");
  });

  it("should allow a customer to view payment by their booking", async () => {
    const response = await request(app)
      .get("/payments/booking/1")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      bookingId: 1,
    });
  });

  it("should allow the hall owner to view payment for their hall booking", async () => {
    const response = await request(app)
      .get("/payments/booking/1")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.bookingId).toBe(1);
  });

  it("should allow an admin to view payment by booking", async () => {
    const response = await request(app)
      .get("/payments/booking/1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.bookingId).toBe(1);
  });

  it("should reject an invalid booking ID for payment lookup", async () => {
    const response = await request(app)
      .get("/payments/booking/abc")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should reject a non-existent booking payment lookup", async () => {
    const response = await request(app)
      .get("/payments/booking/999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Payment not found");
  });

  it("should allow an admin to update payment status to PAID", async () => {
    const payment = await createTemporaryPayment();

    const response = await request(app)
      .patch(`/payments/${payment.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "PAID",
        transactionId: `TEST_TXN_PAYMENT_ACCESS_${Date.now()}`,
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(payment.id);
    expect(response.body.status).toBe("PAID");
    expect(response.body.transactionId).toMatch(
      /^TEST_TXN_PAYMENT_ACCESS_\d+$/,
    );
    expect(response.body.paidAt).not.toBeNull();
  }, 15000);

  it("should reject a customer from updating payment status", async () => {
    const payment = await createTemporaryPayment();

    const response = await request(app)
      .patch(`/payments/${payment.id}/status`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        status: "PAID",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");

    await db.orm.public.Payment.where({
      id: payment.id,
    }).delete();

    await db.orm.public.Booking.where({
      id: payment.bookingId,
    }).delete();

    temporaryPaymentId = 0;
    temporaryBookingId = 0;
  }, 15000);

  it("should reject an invalid payment status", async () => {
    const payment = await createTemporaryPayment();

    try {
      const response = await request(app)
        .patch(`/payments/${payment.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "INVALID",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
    } finally {
      await db.orm.public.Payment.where({
        id: payment.id,
      }).delete();

      await db.orm.public.Booking.where({
        id: payment.bookingId,
      }).delete();

      temporaryPaymentId = 0;
      temporaryBookingId = 0;
    }
  }, 15000);

  it("should allow an admin to delete a temporary payment", async () => {
    const payment = await createTemporaryPayment();

    try {
      const response = await request(app)
        .delete(`/payments/${payment.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Payment deleted successfully");

      const deletedPayment = await db.orm.public.Payment.where({
        id: payment.id,
      }).first();

      expect(deletedPayment).toBeNull();
    } finally {
      await db.orm.public.Payment.where({
        id: payment.id,
      }).delete();

      await db.orm.public.Booking.where({
        id: payment.bookingId,
      }).delete();

      temporaryPaymentId = 0;
      temporaryBookingId = 0;
    }
  }, 15000);

  it("should reject a customer from deleting a payment", async () => {
    const payment = await createTemporaryPayment();

    try {
      const response = await request(app)
        .delete(`/payments/${payment.id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Access denied");
    } finally {
      await db.orm.public.Payment.where({
        id: payment.id,
      }).delete();

      await db.orm.public.Booking.where({
        id: payment.bookingId,
      }).delete();

      temporaryPaymentId = 0;
      temporaryBookingId = 0;
    }
  });
});
