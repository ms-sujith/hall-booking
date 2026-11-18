import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const mocks = vi.hoisted(() => ({
  bookingById: vi.fn(),
  updateBookingStatus: vi.fn(),
  deleteBooking: vi.fn(),
  paymentById: vi.fn(),
  deletePayment: vi.fn(),
  paymentWhere: vi.fn(),
}));

// Replace the real database module before importing controllers.
vi.mock("../src/db", () => ({
  db: {
    orm: {
      public: {
        Payment: {
          where: mocks.paymentWhere,
        },
      },
    },
  },
}));

vi.mock("../src/services/booking.service", () => ({
  createBooking: vi.fn(),
  getBookings: vi.fn(),
  getBookingById: mocks.bookingById,
  getBookingsByUserId: vi.fn(),
  getBookingsByHallId: vi.fn(),
  isBookingSlotAvailable: vi.fn(),
  updateBookingStatus: mocks.updateBookingStatus,
  deleteBooking: mocks.deleteBooking,
}));

vi.mock("../src/services/payment.service", () => ({
  createPayment: vi.fn(),
  getPayments: vi.fn(),
  getPaymentById: mocks.paymentById,
  getPaymentByBookingId: vi.fn(),
  getPaymentsByUserId: vi.fn(),
  updatePaymentStatus: vi.fn(),
  deletePayment: mocks.deletePayment,
}));

import {
  updateBookingStatusController,
  deleteBookingController,
} from "../src/controllers/booking.controller";

import {
  updatePaymentStatusController,
  deletePaymentController,
} from "../src/controllers/payment.controller";

function makeRequest(
  role: string,
  body: Record<string, unknown> = {},
  userId = 11,
): Request {
  return {
    params: { id: "7" },
    body,
    user: { role, userId },
  } as unknown as Request;
}

function makeResponse(): Response {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response as unknown as Response;
}

beforeEach(() => {
  vi.resetAllMocks();

  mocks.bookingById.mockResolvedValue({
    id: 7,
    userId: 11,
    hallId: 5,
    status: "CONFIRMED",
  });

  mocks.paymentById.mockResolvedValue({
    id: 7,
    bookingId: 7,
    paymentMethod: "RAZORPAY",
    status: "PAID",
    transactionId: "pay_test_123",
  });

  mocks.paymentWhere.mockReturnValue({
    first: vi.fn().mockResolvedValue(null),
  });

  mocks.updateBookingStatus.mockResolvedValue({
    id: 7,
    status: "CANCELLED",
  });
});

describe("HallBook booking payment safeguards", () => {
  it("blocks cancellation of a payment-linked booking", async () => {
    mocks.paymentWhere.mockReturnValue({
      first: vi.fn().mockResolvedValue({ id: 20 }),
    });

    const response = makeResponse();

    await updateBookingStatusController(
      makeRequest("CUSTOMER", { status: "CANCELLED" }),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(mocks.updateBookingStatus).not.toHaveBeenCalled();
  });

  it("rejects unauthorized cancellation before payment lookup", async () => {
    const response = makeResponse();

    await updateBookingStatusController(
      makeRequest("CUSTOMER", { status: "CANCELLED" }, 99),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(mocks.paymentWhere).not.toHaveBeenCalled();
  });

  it("blocks deletion of a payment-linked booking", async () => {
    mocks.paymentWhere.mockReturnValue({
      first: vi.fn().mockResolvedValue({ id: 20 }),
    });

    const response = makeResponse();

    await deleteBookingController(
      makeRequest("ADMIN"),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(mocks.deleteBooking).not.toHaveBeenCalled();
  });

  it("preserves booking cancellation when no payment exists", async () => {
    const response = makeResponse();

    await updateBookingStatusController(
      makeRequest("CUSTOMER", { status: "CANCELLED" }),
      response,
    );

    expect(mocks.updateBookingStatus).toHaveBeenCalledWith(
      7,
      "CANCELLED",
    );
    expect(response.json).toHaveBeenCalled();
  });
});

describe("HallBook payment administration safeguards", () => {
  it("blocks manual Razorpay status updates", async () => {
    const response = makeResponse();

    await updatePaymentStatusController(
      makeRequest("ADMIN", { status: "PAID" }),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(409);
  });

  it("blocks manual refund status changes", async () => {
    mocks.paymentById.mockResolvedValue({
      id: 7,
      paymentMethod: "UPI",
      status: "PAID",
    });

    const response = makeResponse();

    await updatePaymentStatusController(
      makeRequest("ADMIN", { status: "REFUNDED" }),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(409);
  });

  it("blocks deletion of a captured payment", async () => {
    const response = makeResponse();

    await deletePaymentController(
      makeRequest("ADMIN"),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(mocks.deletePayment).not.toHaveBeenCalled();
  });

  it("blocks deletion of a paid non-Razorpay payment", async () => {
    mocks.paymentById.mockResolvedValue({
      id: 7,
      paymentMethod: "UPI",
      status: "PAID",
    });

    const response = makeResponse();

    await deletePaymentController(
      makeRequest("ADMIN"),
      response,
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(mocks.deletePayment).not.toHaveBeenCalled();
  });
});