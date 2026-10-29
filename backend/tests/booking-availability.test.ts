import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import "temporal-polyfill/global";
import { Temporal } from "temporal-polyfill";

import app from "../src/app";
import { db } from "../src/db";

describe("Booking Availability API", () => {
  // A fixture booking makes overlap tests independent of existing DB contents.
  const testDate = "2027-04-20T00:00:00.000Z";
  let blockingBookingId: number | undefined;

  beforeAll(async () => {
    const booking = await db.orm.public.Booking.create({
      userId: 11,
      hallId: 5,
      bookingDate: Temporal.Instant.from(testDate),
      startTime: "10:00",
      endTime: "18:00",
      guests: 100,
      totalAmount: "55000",
      status: "CONFIRMED",
    });

    blockingBookingId = booking.id;
  });

  afterAll(async () => {
    if (blockingBookingId !== undefined) {
      await db.orm.public.Booking.where({ id: blockingBookingId }).delete();
    }
  });

  it("should return available for a free time slot", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${encodeURIComponent(testDate)}&startTime=18:00&endTime=22:00`,
    );

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(true);
  });

  it("should return unavailable for an exact overlapping slot", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${encodeURIComponent(testDate)}&startTime=10:00&endTime=18:00`,
    );

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(false);
    expect(response.body.message).toBe(
      "Booking slot is unavailable for the selected time",
    );
  });

  it("should return unavailable for a partially overlapping slot", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${encodeURIComponent(testDate)}&startTime=17:00&endTime=20:00`,
    );

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(false);
  });

  it("should reject an invalid start time", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${encodeURIComponent(testDate)}&startTime=25:00&endTime=18:00`,
    );

    expect(response.status).toBe(400);
  });

  it("should reject when end time is before start time", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${encodeURIComponent(testDate)}&startTime=18:00&endTime=10:00`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("End time must be after start time");
  });

  it("should reject an invalid booking date", async () => {
    const response = await request(app).get(
      "/bookings/availability?hallId=5&bookingDate=invalid-date&startTime=10:00&endTime=18:00",
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid booking date");
  });

  it("should return 404 when the hall does not exist", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=999999&bookingDate=${encodeURIComponent(testDate)}&startTime=10:00&endTime=18:00`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Hall not found");
  });

  it("should allow availability checks without authentication", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${encodeURIComponent(testDate)}&startTime=18:00&endTime=22:00`,
    );

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });
});
