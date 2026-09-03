import { describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app";
import { db } from "../src/db";
import "temporal-polyfill/global";
import { Temporal } from "temporal-polyfill";

async function getToken(email: string, password: string) {
  const response = await request(app).post("/auth/login").send({
    email,
    password,
  });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeTypeOf("string");

  return response.body.token as string;
}

async function createConfirmedBookingForReview(userId: number) {
  return db.orm.public.Booking.create({
    userId,
    hallId: 5,
    bookingDate: Temporal.Instant.from("2026-12-15T00:00:00Z"),
    startTime: "10:00",
    endTime: "18:00",
    guests: 100,
    totalAmount: "55000",
    status: "CONFIRMED",
  });
}

async function createTemporaryCustomer() {
  const email = `review-test-${Date.now()}@example.com`;
  const password = "ReviewTest@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.orm.public.User.create({
    name: "Review Test Customer",
    email,
    passwordHash,
    role: "CUSTOMER",
  });

  return {
    user,
    email,
    password,
  };
}

describe("Review API", () => {
  it("should create a review after a confirmed booking", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const booking = await createConfirmedBookingForReview(11);

    try {
      const response = await request(app)
        .post("/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          hallId: 5,
          rating: 5,
          comment: "Excellent hall and service",
        });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(11);
      expect(response.body.hallId).toBe(5);
      expect(response.body.rating).toBe(5);
      expect(response.body.comment).toBe("Excellent hall and service");
    } finally {
      await db.orm.public.Review.where({
        userId: 11,
        hallId: 5,
      }).delete();

      await db.orm.public.Booking.where({
        id: booking.id,
      }).delete();
    }
  }, 15000);

  it("should reject an unauthenticated review request", async () => {
    const response = await request(app).post("/reviews").send({
      hallId: 5,
      rating: 5,
      comment: "Unauthenticated review",
    });

    expect(response.status).toBe(401);
  });

  it("should reject an owner from creating a review", async () => {
    const ownerToken = await getToken("owner@test.com", "Owner@123");

    const response = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        hallId: 5,
        rating: 5,
        comment: "Owner review",
      });

    expect(response.status).toBe(403);
  });

  it("should reject a customer who has no confirmed booking", async () => {
    const temporaryCustomer = await createTemporaryCustomer();

    try {
      const customerToken = await getToken(
        temporaryCustomer.email,
        temporaryCustomer.password,
      );

      const response = await request(app)
        .post("/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          hallId: 5,
          rating: 5,
          comment: "Should not be allowed",
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "You can only review a hall after having a confirmed booking",
      );
    } finally {
      await db.orm.public.User.where({
        id: temporaryCustomer.user.id,
      }).delete();
    }
  });

  it("should reject an invalid rating", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        hallId: 5,
        rating: 6,
        comment: "Invalid rating",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should reject an invalid hall ID", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        hallId: 0,
        rating: 5,
        comment: "Invalid hall",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should return reviews for a hall", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .get("/reviews/hall/5")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should reject an invalid review ID", async () => {
    const customerToken = await getToken("suresh@test.com", "Suresh@123");

    const response = await request(app)
      .get("/reviews/abc")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});
