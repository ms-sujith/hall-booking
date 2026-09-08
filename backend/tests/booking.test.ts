import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";

// ====================
// Get Authentication Token
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
// Booking API Tests
// ====================

describe("Booking API", () => {
  // ====================
  // Create Booking
  // ====================

  it("should create a booking successfully and ignore a client-supplied amount", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        hallId: 5,
        bookingDate: "2026-10-15T00:00:00Z",
        startTime: "10:00",
        endTime: "18:00",
        guests: 100,
        totalAmount: 1,
      });

    expect(response.status).toBe(201);

    expect(response.body.userId).toBe(11);
    expect(response.body.hallId).toBe(5);
    expect(response.body.guests).toBe(100);
    expect(response.body.totalAmount.toString()).toBe("55000");
    expect(response.body.status).toBe("PENDING");

    const bookingId = response.body.id;

    try {
      const deleteResponse = await request(app)
        .delete(`/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(deleteResponse.status).toBe(200);

      expect(deleteResponse.body.message).toBe("Booking deleted successfully");
    } catch (error) {
      throw error;
    }
  }, 15000);

  // ====================
  // Authentication
  // ====================

  it("should reject an unauthenticated booking request", async () => {
    const response = await request(app).post("/bookings").send({
      hallId: 5,
      bookingDate: "2026-10-16T00:00:00Z",
      startTime: "10:00",
      endTime: "18:00",
      guests: 100,
    });

    expect(response.status).toBe(401);
  });

  // ====================
  // Role Authorization
  // ====================

  it("should reject an owner from creating a booking", async () => {
    const ownerToken = await getToken("owner@test.com", "Owner@123");

    const response = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        hallId: 5,
        bookingDate: "2026-10-17T00:00:00Z",
        startTime: "10:00",
        endTime: "18:00",
        guests: 100,
      });

    expect(response.status).toBe(403);
  });

  // ====================
  // Guest Validation
  // ====================

  it("should reject guests above hall capacity", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        hallId: 5,
        bookingDate: "2026-10-18T00:00:00Z",
        startTime: "10:00",
        endTime: "18:00",
        guests: 999999,
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toContain(
      "Guest count exceeds hall capacity",
    );
  });

  // ====================
  // Time Validation
  // ====================

  it("should reject an invalid time format", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        hallId: 5,
        bookingDate: "2026-10-19T00:00:00Z",
        startTime: "10:70",
        endTime: "18:00",
        guests: 100,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should reject when end time is before start time", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        hallId: 5,
        bookingDate: "2026-10-20T00:00:00Z",
        startTime: "18:00",
        endTime: "10:00",
        guests: 100,
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("End time must be after start time");
  });

  // ====================
  // Date Validation
  // ====================

  it("should reject an invalid booking date", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        hallId: 5,
        bookingDate: "not-a-date",
        startTime: "10:00",
        endTime: "18:00",
        guests: 100,
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("Invalid booking date");
  });

  // ====================
  // Overlap Validation
  // ====================

  it("should reject an overlapping booking slot", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        hallId: 5,
        bookingDate: "2026-09-15T00:00:00Z",
        startTime: "12:00",
        endTime: "16:00",
        guests: 100,
      });

    expect(response.status).toBe(409);

    expect(response.body).toEqual({
      message: "Booking slot is unavailable for the selected time",
    });
  });

  // ====================
  // Guest Count Validation
  // ====================

  it("should reject invalid guests", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        hallId: 5,
        bookingDate: "2026-10-21T00:00:00Z",
        startTime: "10:00",
        endTime: "18:00",
        guests: 0,
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("Validation failed");
  });
});
