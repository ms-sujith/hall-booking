import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";

describe("Booking Availability API", () => {
  const testDate = "2026-10-15T00:00:00Z";

  // ====================
  // Available Slot
  // ====================

  it("should return available for a free time slot", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${testDate}&startTime=18:00&endTime=22:00`,
    );

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(true);
  });

  // ====================
  // Exact Overlap
  // ====================

  it("should return unavailable for an exact overlapping slot", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${testDate}&startTime=10:00&endTime=18:00`,
    );

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(false);
    expect(response.body.message).toBe(
      "Booking slot is unavailable for the selected time",
    );
  });

  // ====================
  // Partial Overlap
  // ====================

  it("should return unavailable for a partially overlapping slot", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${testDate}&startTime=17:00&endTime=20:00`,
    );

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(false);
  });

  // ====================
  // Invalid Start Time
  // ====================

  it("should reject an invalid start time", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${testDate}&startTime=25:00&endTime=18:00`,
    );

    expect(response.status).toBe(400);
  });

  // ====================
  // Invalid End Time
  // ====================

  it("should reject when end time is before start time", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${testDate}&startTime=18:00&endTime=10:00`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("End time must be after start time");
  });

  // ====================
  // Invalid Booking Date
  // ====================

  it("should reject an invalid booking date", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=invalid-date&startTime=10:00&endTime=18:00`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid booking date");
  });

  // ====================
  // Hall Not Found
  // ====================

  it("should return 404 when the hall does not exist", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=999999&bookingDate=${testDate}&startTime=10:00&endTime=18:00`,
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Hall not found");
  });

  // ====================
  // Public Endpoint
  // ====================

  it("should allow availability checks without authentication", async () => {
    const response = await request(app).get(
      `/bookings/availability?hallId=5&bookingDate=${testDate}&startTime=18:00&endTime=22:00`,
    );

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });
});
