import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { createHmac } from "node:crypto";
import "temporal-polyfill/global";
import { Temporal } from "temporal-polyfill";

import app from "../src/app";
import { db } from "../src/db";
import { env } from "../src/config/env";

// ====================
// Razorpay SDK Mock
// ====================

const razorpayOrdersCreate = vi.fn();
const razorpayPaymentsFetch = vi.fn();

vi.mock("razorpay", () => ({
  default: class MockRazorpay {
    orders = {
      create: razorpayOrdersCreate,
    };

    payments = {
      fetch: razorpayPaymentsFetch,
    };
  },
}));

const TEST_RAZORPAY_SECRET = "razorpay_test_secret_only_for_tests";
const originalKeyId = env.RAZORPAY_KEY_ID;
const originalKeySecret = env.RAZORPAY_KEY_SECRET;

// ====================
// Authentication
// ====================

const tokenCache = new Map<string, string>();

async function getToken(email: string, password: string) {
  const cachedToken = tokenCache.get(email);

  if (cachedToken) {
    return cachedToken;
  }

  const response = await request(app).post("/auth/login").send({
    email,
    password,
  });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeTypeOf("string");

  const token = response.body.token as string;
  tokenCache.set(email, token);

  return token;
}

// ====================
// Temporary Booking Helpers
// ====================

async function createConfirmedBooking(userId = 11) {
  return db.orm.public.Booking.create({
    userId,
    hallId: 5,
    bookingDate: Temporal.Instant.from("2027-02-15T00:00:00Z"),
    startTime: "10:00",
    endTime: "18:00",
    guests: 100,
    totalAmount: "55000",
    status: "CONFIRMED",
  });
}

async function createPendingBooking(userId = 11) {
  return db.orm.public.Booking.create({
    userId,
    hallId: 5,
    bookingDate: Temporal.Instant.from("2027-02-16T00:00:00Z"),
    startTime: "10:00",
    endTime: "18:00",
    guests: 100,
    totalAmount: "55000",
    status: "PENDING",
  });
}

// ====================
// Temporary Customer Helper
// ====================

async function createTemporaryCustomer() {
  const email = `payment-test-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@example.com`;
  const password = "PaymentTest@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.orm.public.User.create({
    name: "Payment Test Customer",
    email,
    passwordHash,
    role: "CUSTOMER",
  });

  return { user, email, password };
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

async function deleteBooking(bookingId: number) {
  await deletePaymentForBooking(bookingId);
  await db.orm.public.Booking.where({ id: bookingId }).delete();
}

function configureRazorpay() {
  Object.assign(env, {
    RAZORPAY_KEY_ID: "rzp_test_key",
    RAZORPAY_KEY_SECRET: TEST_RAZORPAY_SECRET,
  });
}

function signPayment(orderId: string, paymentId: string) {
  return createHmac("sha256", TEST_RAZORPAY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

// ====================
// Restore Mock State
// ====================

afterEach(() => {
  razorpayOrdersCreate.mockReset();
  razorpayOrdersCreate.mockResolvedValue({ id: "order_test_123" });
  razorpayPaymentsFetch.mockReset();

  Object.assign(env, {
    RAZORPAY_KEY_ID: originalKeyId,
    RAZORPAY_KEY_SECRET: originalKeySecret,
  });
});

// ====================
// Existing Payment API Tests
// ====================

describe("Payment API", () => {
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
      await deleteBooking(booking.id);
    }
  }, 15000);

  it("should reject an unauthenticated payment request", async () => {
    const response = await request(app).post("/payments").send({
      bookingId: 1,
      paymentMethod: "UPI",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authorization token required");
  });

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

  it("should reject payment when another customer tries to pay for another customer's booking", async () => {
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
      await deleteBooking(booking.id);
    }
  });

  it("should reject a duplicate payment for an existing booking", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");
    const booking = await createConfirmedBooking();

    try {
      const firstResponse = await request(app)
        .post("/payments")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          bookingId: booking.id,
          paymentMethod: "UPI",
        });

      expect(firstResponse.status).toBe(201);

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
      await deleteBooking(booking.id);
    }
  }, 15000);

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

// ====================
// Razorpay Order API Tests
// ====================

describe("Razorpay Order API", () => {
  it("should reject an unauthenticated order request", async () => {
    const response = await request(app)
      .post("/payments/razorpay/order")
      .send({ bookingId: 1 });

    expect(response.status).toBe(401);
  });

  it("should reject an invalid booking ID", async () => {
    const token = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/payments/razorpay/order")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookingId: 0 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid booking ID.");
  });

  it("should create a Razorpay order using the booking amount", async () => {
    configureRazorpay();

    const token = await getToken("suresh@test.com", "Suresh@123");
    const booking = await createConfirmedBooking();

    razorpayOrdersCreate.mockResolvedValueOnce({
      id: "order_test_123",
    });

    try {
      const response = await request(app)
        .post("/payments/razorpay/order")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: booking.id,
          amount: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.orderId).toBe("order_test_123");
      expect(response.body.amount).toBe(5500000);
      expect(response.body.currency).toBe("INR");
      expect(response.body.bookingId).toBe(booking.id);
      expect(response.body.keyId).toBe("rzp_test_key");

      expect(razorpayOrdersCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5500000,
          currency: "INR",
          notes: expect.objectContaining({
            bookingId: String(booking.id),
          }),
        }),
      );

      const payment = await db.orm.public.Payment.where({
        bookingId: booking.id,
      }).first();

      expect(payment?.status).toBe("PENDING");
      expect(payment?.transactionId).toBe("order_test_123");
    } finally {
      await deleteBooking(booking.id);
    }
  }, 15000);

  it("should reject an order request for another customer's booking", async () => {
    configureRazorpay();

    const temporaryCustomer = await createTemporaryCustomer();
    const booking = await createConfirmedBooking();

    try {
      const token = await getToken(
        temporaryCustomer.email,
        temporaryCustomer.password,
      );

      const response = await request(app)
        .post("/payments/razorpay/order")
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: booking.id });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "You cannot pay for another customer's booking.",
      );
      expect(razorpayOrdersCreate).not.toHaveBeenCalled();
    } finally {
      await deleteBooking(booking.id);
      await db.orm.public.User.where({
        id: temporaryCustomer.user.id,
      }).delete();
    }
  }, 15000);

  it("should reject an order for a non-confirmed booking", async () => {
    configureRazorpay();

    const token = await getToken("suresh@test.com", "Suresh@123");
    const booking = await createPendingBooking();

    try {
      const response = await request(app)
        .post("/payments/razorpay/order")
        .set("Authorization", `Bearer ${token}`)
        .send({ bookingId: booking.id });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Only confirmed bookings can be paid for.",
      );
      expect(razorpayOrdersCreate).not.toHaveBeenCalled();
    } finally {
      await deleteBooking(booking.id);
    }
  }, 15000);
});

// ====================
// Razorpay Verification API Tests
// ====================

describe("Razorpay Verification API", () => {
  it("should reject an invalid signature without marking payment as paid", async () => {
    configureRazorpay();

    const token = await getToken("suresh@test.com", "Suresh@123");
    const booking = await createConfirmedBooking();

    try {
      await db.orm.public.Payment.create({
        bookingId: booking.id,
        amount: "55000",
        paymentMethod: "RAZORPAY",
        transactionId: "order_test_123",
        status: "PENDING",
        paidAt: null,
      });

      const response = await request(app)
        .post("/payments/razorpay/verify")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: booking.id,
          razorpay_order_id: "order_test_123",
          razorpay_payment_id: "pay_test_123",
          razorpay_signature: "a".repeat(64),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Razorpay payment signature verification failed.",
      );

      const payment = await db.orm.public.Payment.where({
        bookingId: booking.id,
      }).first();

      expect(payment?.status).toBe("PENDING");
      expect(payment?.transactionId).toBe("order_test_123");
    } finally {
      await deleteBooking(booking.id);
    }
  }, 15000);

  it("should reject a valid signature when the order does not match the stored order", async () => {
    configureRazorpay();

    const token = await getToken("suresh@test.com", "Suresh@123");
    const booking = await createConfirmedBooking();

    try {
      await db.orm.public.Payment.create({
        bookingId: booking.id,
        amount: "55000",
        paymentMethod: "RAZORPAY",
        transactionId: "order_stored_123",
        status: "PENDING",
        paidAt: null,
      });

      const orderId = "order_different_123";
      const paymentId = "pay_test_123";

      const response = await request(app)
        .post("/payments/razorpay/verify")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: booking.id,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signPayment(orderId, paymentId),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "The Razorpay order does not match this booking's payment.",
      );

      const payment = await db.orm.public.Payment.where({
        bookingId: booking.id,
      }).first();

      expect(payment?.status).toBe("PENDING");
    } finally {
      await deleteBooking(booking.id);
    }
  }, 15000);

  it("should not mark an authorized but uncaptured payment as paid", async () => {
    configureRazorpay();

    const token = await getToken("suresh@test.com", "Suresh@123");
    const booking = await createConfirmedBooking();
    const orderId = "order_uncaptured_123";
    const paymentId = "pay_uncaptured_123";

    try {
      await db.orm.public.Payment.create({
        bookingId: booking.id,
        amount: "55000",
        paymentMethod: "RAZORPAY",
        transactionId: orderId,
        status: "PENDING",
        paidAt: null,
      });

      razorpayPaymentsFetch.mockResolvedValueOnce({
        id: paymentId,
        order_id: orderId,
        amount: 5500000,
        currency: "INR",
        status: "authorized",
        captured: false,
      });

      const response = await request(app)
        .post("/payments/razorpay/verify")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: booking.id,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signPayment(orderId, paymentId),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("captured payment");

      const payment = await db.orm.public.Payment.where({
        bookingId: booking.id,
      }).first();
      expect(payment?.status).toBe("PENDING");
      expect(payment?.transactionId).toBe(orderId);
    } finally {
      await deleteBooking(booking.id);
    }
  }, 15000);

  it("should not mark a captured payment with the wrong amount as paid", async () => {
    configureRazorpay();

    const token = await getToken("suresh@test.com", "Suresh@123");
    const booking = await createConfirmedBooking();
    const orderId = "order_wrong_amount_123";
    const paymentId = "pay_wrong_amount_123";

    try {
      await db.orm.public.Payment.create({
        bookingId: booking.id,
        amount: "55000",
        paymentMethod: "RAZORPAY",
        transactionId: orderId,
        status: "PENDING",
        paidAt: null,
      });

      razorpayPaymentsFetch.mockResolvedValueOnce({
        id: paymentId,
        order_id: orderId,
        amount: 100,
        currency: "INR",
        status: "captured",
        captured: true,
      });

      const response = await request(app)
        .post("/payments/razorpay/verify")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: booking.id,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signPayment(orderId, paymentId),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("captured payment");

      const payment = await db.orm.public.Payment.where({
        bookingId: booking.id,
      }).first();
      expect(payment?.status).toBe("PENDING");
      expect(payment?.transactionId).toBe(orderId);
    } finally {
      await deleteBooking(booking.id);
    }
  }, 15000);

  it("should mark payment as paid after valid signature and matching order", async () => {
    configureRazorpay();

    const token = await getToken("suresh@test.com", "Suresh@123");
    const booking = await createConfirmedBooking();

    const orderId = "order_valid_123";
    const paymentId = "pay_valid_123";

    try {
      await db.orm.public.Payment.create({
        bookingId: booking.id,
        amount: "55000",
        paymentMethod: "RAZORPAY",
        transactionId: orderId,
        status: "PENDING",
        paidAt: null,
      });

      razorpayPaymentsFetch.mockResolvedValueOnce({
        id: paymentId,
        order_id: orderId,
        amount: 5500000,
        currency: "INR",
        status: "captured",
        captured: true,
      });

      const response = await request(app)
        .post("/payments/razorpay/verify")
        .set("Authorization", `Bearer ${token}`)
        .send({
          bookingId: booking.id,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signPayment(orderId, paymentId),
        });

      expect(razorpayPaymentsFetch).toHaveBeenCalledWith(paymentId);
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("PAID");

      const payment = await db.orm.public.Payment.where({
        bookingId: booking.id,
      }).first();

      expect(payment?.status).toBe("PAID");
      expect(payment?.transactionId).toBe(paymentId);
      expect(payment?.paidAt).not.toBeNull();
    } finally {
      await deleteBooking(booking.id);
    }
  }, 15000);
});
