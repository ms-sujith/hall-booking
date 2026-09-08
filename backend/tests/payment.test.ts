import { describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app";
import { db } from "../src/db";
import "temporal-polyfill/global";
import { Temporal } from "temporal-polyfill";

// ====================
// Authentication
// ====================

async function getToken(email: string, password: string) {
  const response = await request(app).post("/auth/login").send({
    email,
    password,
  });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeTypeOf("string");

  return response.body.token as string;
}

// ====================
// Temporary Booking Helpers
// ====================

async function createConfirmedBooking() {
  const booking = await db.orm.public.Booking.create({
    userId: 11,
    hallId: 5,
    bookingDate: Temporal.Instant.from("2026-11-15T00:00:00Z"),
    startTime: "10:00",
    endTime: "18:00",
    guests: 100,
    totalAmount: "55000",
    status: "CONFIRMED",
  });

  return booking;
}

async function createPendingBooking() {
  const booking = await db.orm.public.Booking.create({
    userId: 11,
    hallId: 5,
    bookingDate: Temporal.Instant.from("2026-11-16T00:00:00Z"),
    startTime: "10:00",
    endTime: "18:00",
    guests: 100,
    totalAmount: "55000",
    status: "PENDING",
  });

  return booking;
}

// ====================
// Temporary Customer Helper
// ====================

async function createTemporaryCustomer() {
  const email = `payment-test-${Date.now()}@example.com`;
  const passwordHash = await bcrypt.hash("PaymentTest@123", 10);

  const user = await db.orm.public.User.create({
    name: "Payment Test Customer",
    email,
    passwordHash,
    role: "CUSTOMER",
  });

  return {
    user,
    email,
    password: "PaymentTest@123",
  };
}

// ====================
// Payment Cleanup Helper
// ====================

async function deletePaymentForBooking(bookingId: number) {
  const payment = await db.orm.public.Payment.where({
    bookingId,
  }).first();

  if (payment) {
    await db.orm.public.Payment.where({
      id: payment.id,
    }).delete();
  }
}

// ====================
// Payment API Tests
// ====================

describe("Payment API", () => {
  // ====================
  // Create Payment
  // ====================

  it("should create a payment for a confirmed booking and ignore client-supplied amount", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const booking = await createConfirmedBooking();

    try {
      const response = await request(app)
        .post("/payments")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          bookingId: booking.id,
          paymentMethod: "UPI",
          amount: 1,
        });

      expect(response.status).toBe(201);

      expect(response.body.bookingId).toBe(booking.id);
      expect(response.body.amount.toString()).toBe("55000");
      expect(response.body.paymentMethod).toBe("UPI");
      expect(response.body.status).toBe("PENDING");
      expect(response.body.transactionId).toBeNull();

      expect(response.body.id).toBeTypeOf("number");
    } finally {
      await deletePaymentForBooking(booking.id);

      await db.orm.public.Booking.where({
        id: booking.id,
      }).delete();
    }
  }, 15000);

  // ====================
  // Authentication
  // ====================

  it("should reject an unauthenticated payment request", async () => {
    const response = await request(app).post("/payments").send({
      bookingId: 1,
      paymentMethod: "UPI",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authorization token required");
  });

  // ====================
  // Role Authorization
  // ====================

  it("should reject an owner from creating a payment", async () => {
    const ownerToken = await getToken("owner@test.com", "Owner@123");

    const response = await request(app)
      .post("/payments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        bookingId: 1,
        paymentMethod: "UPI",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  // ====================
  // Booking Ownership
  // ====================

  it("should reject payment when another customer tries to pay for Suresh's booking", async () => {
    const temporaryCustomer = await createTemporaryCustomer();

    try {
      const customerToken = await getToken(
        temporaryCustomer.email,
        temporaryCustomer.password,
      );

      const response = await request(app)
        .post("/payments")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          bookingId: 1,
          paymentMethod: "UPI",
        });

      expect(response.status).toBe(403);

      expect(response.body.message).toBe(
        "You can only make payment for your own booking",
      );
    } finally {
      await db.orm.public.User.where({
        id: temporaryCustomer.user.id,
      }).delete();
    }
  });

  // ====================
  // Booking Status
  // ====================

  it("should reject payment for a non-confirmed booking", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const booking = await createPendingBooking();

    try {
      const response = await request(app)
        .post("/payments")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          bookingId: booking.id,
          paymentMethod: "UPI",
        });

      expect(response.status).toBe(400);

      expect(response.body.message).toBe(
        "Payment is allowed only for confirmed bookings",
      );
    } finally {
      await db.orm.public.Booking.where({
        id: booking.id,
      }).delete();
    }
  });

  // ====================
  // Duplicate Payment
  // ====================

  it("should reject a duplicate payment for an existing booking", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const booking = await createConfirmedBooking();

    try {
      // Create the first payment.
      const firstPaymentResponse = await request(app)
        .post("/payments")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          bookingId: booking.id,
          paymentMethod: "UPI",
        });

      expect(firstPaymentResponse.status).toBe(201);

      // Try to create another payment for the same booking.
      const response = await request(app)
        .post("/payments")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          bookingId: booking.id,
          paymentMethod: "UPI",
        });

      expect(response.status).toBe(409);

      expect(response.body.message).toBe(
        "Payment already exists for this booking",
      );
    } finally {
      await deletePaymentForBooking(booking.id);

      await db.orm.public.Booking.where({
        id: booking.id,
      }).delete();
    }
  }, 15000);

  // ====================
  // Booking ID Validation
  // ====================

  it("should reject an invalid booking ID", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/payments")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId: 0,
        paymentMethod: "UPI",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  // ====================
  // Payment Method Validation
  // ====================

  it("should reject an invalid payment method", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/payments")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingId: 1,
        paymentMethod: "X",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});
