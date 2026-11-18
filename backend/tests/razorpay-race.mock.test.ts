import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const mocks = vi.hoisted(() => ({
  payment: null as any,
  beforeUpdate: null as null | (() => void),
  ordersCreate: vi.fn(),
  paymentsFetch: vi.fn(),
}));

vi.mock("../src/config/env", () => ({
  env: {
    RAZORPAY_KEY_ID: "rzp_test_mock",
    RAZORPAY_KEY_SECRET: "fake-test-secret",
  },
}));

vi.mock("razorpay", () => ({
  default: class MockRazorpay {
    orders = {
      create: mocks.ordersCreate,
      fetch: vi.fn(),
      fetchPayments: vi.fn(),
    };
    payments = {
      fetch: mocks.paymentsFetch,
    };
  },
}));

vi.mock("../src/db", () => {
  const matches = (query: any, record: any) =>
    record !== null &&
    Object.keys(query).every((key) => record[key] === query[key]);

  return {
    db: {
      orm: {
        public: {
          Booking: {
            where: () => ({
              first: async () => ({
                id: 10,
                userId: 7,
                status: "CONFIRMED",
                totalAmount: { toString: () => "100.00" },
              }),
            }),
          },
          Payment: {
            where: (query: any) => ({
              first: async () =>
                matches(query, mocks.payment)
                  ? { ...mocks.payment }
                  : null,

              update: async (changes: any) => {
                if (mocks.beforeUpdate) {
                  const action = mocks.beforeUpdate;
                  mocks.beforeUpdate = null;
                  action();
                }

                if (!matches(query, mocks.payment)) {
                  return null;
                }

                mocks.payment = {
                  ...mocks.payment,
                  ...changes,
                };

                return { ...mocks.payment };
              },
            }),
            create: async (data: any) => {
              mocks.payment = { id: 55, ...data };
              return { ...mocks.payment };
            },
          },
        },
      },
    },
  };
});

import {
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
} from "../src/controllers/razorpay.controller";

function response() {
  const res: any = {
    statusCode: 200,
    body: null,
  };

  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };

  res.json = (body: any) => {
    res.body = body;
    return res;
  };

  return res;
}

function pendingPayment(transactionId: string | null = "order_old") {
  return {
    id: 55,
    bookingId: 10,
    amount: "100.00",
    paymentMethod: "RAZORPAY",
    transactionId,
    status: "PENDING",
    paidAt: null,
  };
}

function orderRequest() {
  return {
    user: { userId: 7 },
    body: { bookingId: 10 },
  } as any;
}

function verifyRequest() {
  const orderId = "order_old";
  const paymentId = "pay_new";

  const signature = createHmac("sha256", "fake-test-secret")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return {
    user: { userId: 7 },
    body: {
      bookingId: 10,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    },
  } as any;
}

beforeEach(() => {
  mocks.payment = null;
  mocks.beforeUpdate = null;

  mocks.ordersCreate.mockReset();
  mocks.paymentsFetch.mockReset();

  mocks.ordersCreate.mockResolvedValue({ id: "order_new" });
  mocks.paymentsFetch.mockResolvedValue({
    id: "pay_new",
    order_id: "order_old",
    amount: 10000,
    currency: "INR",
    status: "captured",
    captured: true,
  });
});

describe("HallBook Razorpay payment race protection", () => {
  it("does not overwrite PAID while linking an order", async () => {
    mocks.payment = {
      ...pendingPayment(null),
      paymentMethod: "CASH",
    };

    mocks.beforeUpdate = () => {
      mocks.payment.status = "PAID";
      mocks.payment.transactionId = "pay_already";
    };

    const res = response();

    await createRazorpayOrderController(orderRequest(), res);

    expect(res.statusCode).toBe(409);
    expect(mocks.payment.status).toBe("PAID");
    expect(mocks.payment.transactionId).toBe("pay_already");
  });

  it("links a legacy pending record when unchanged", async () => {
    mocks.payment = {
      ...pendingPayment(null),
      paymentMethod: "CASH",
    };

    const res = response();

    await createRazorpayOrderController(orderRequest(), res);

    expect(res.statusCode).toBe(200);
    expect(mocks.payment.status).toBe("PENDING");
    expect(mocks.payment.transactionId).toBe("order_new");
    expect(res.body.orderId).toBe("order_new");
  });

  it("cannot overwrite a different captured payment", async () => {
    mocks.payment = pendingPayment();

    mocks.beforeUpdate = () => {
      mocks.payment.status = "PAID";
      mocks.payment.transactionId = "pay_other";
    };

    const res = response();

    await verifyRazorpayPaymentController(verifyRequest(), res);

    expect(res.statusCode).toBe(409);
    expect(mocks.payment.status).toBe("PAID");
    expect(mocks.payment.transactionId).toBe("pay_other");
  });

  it("accepts a webhook-first capture of the same payment", async () => {
    mocks.payment = pendingPayment();

    mocks.beforeUpdate = () => {
      mocks.payment.status = "PAID";
      mocks.payment.transactionId = "pay_new";
    };

    const res = response();

    await verifyRazorpayPaymentController(verifyRequest(), res);

    expect(res.statusCode).toBe(200);
    expect(mocks.payment.status).toBe("PAID");
    expect(mocks.payment.transactionId).toBe("pay_new");
  });

  it("marks a normally verified captured payment PAID", async () => {
    mocks.payment = pendingPayment();

    const res = response();

    await verifyRazorpayPaymentController(verifyRequest(), res);

    expect(res.statusCode).toBe(200);
    expect(mocks.payment.status).toBe("PAID");
    expect(mocks.payment.transactionId).toBe("pay_new");
  });

  it("rejects a payment with an incorrect amount", async () => {
    mocks.payment = pendingPayment();

    mocks.paymentsFetch.mockResolvedValue({
      id: "pay_new",
      order_id: "order_old",
      amount: 5000,
      currency: "INR",
      status: "captured",
      captured: true,
    });

    const res = response();

    await verifyRazorpayPaymentController(verifyRequest(), res);

    expect(res.statusCode).toBe(400);
    expect(mocks.payment.status).toBe("PENDING");
    expect(mocks.payment.transactionId).toBe("order_old");
  });
});