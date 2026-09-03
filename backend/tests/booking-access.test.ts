import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app";
import { db } from "../src/db";
import "temporal-polyfill/global";
import { Temporal } from "temporal-polyfill";

let customerToken: string;
let ownerToken: string;
let adminToken: string;
let temporaryOwnerToken: string;
let anotherCustomerToken: string;

let temporaryOwnerUserId: number;
let temporaryOwnerHallOwnerId: number;
let anotherCustomerUserId: number;

async function getToken(email: string, password: string) {
  const response = await request(app).post("/auth/login").send({
    email,
    password,
  });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeTypeOf("string");

  return response.body.token as string;
}

async function createTemporaryBooking() {
  return db.orm.public.Booking.create({
    userId: 11,
    hallId: 5,
    bookingDate: Temporal.Instant.from("2027-01-15T00:00:00Z"),
    startTime: "10:00",
    endTime: "18:00",
    guests: 100,
    totalAmount: "55000",
    status: "PENDING",
  });
}

async function createTemporaryOwner() {
  const email = `booking-owner-test-${Date.now()}@example.com`;
  const password = "BookingOwner@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.orm.public.User.create({
    name: "Booking Access Owner",
    email,
    passwordHash,
    role: "OWNER",
  });

  const hallOwner = await db.orm.public.HallOwner.create({
    userId: user.id,
    phone: "9999999999",
  });

  return {
    user,
    hallOwner,
    email,
    password,
  };
}

async function createTemporaryCustomer() {
  const email = `booking-access-${Date.now()}@example.com`;
  const password = "BookingAccess@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.orm.public.User.create({
    name: "Booking Access Customer",
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

beforeAll(async () => {
  customerToken = await getToken("suresh@test.com", "Suresh@123");

  ownerToken = await getToken("owner@test.com", "Owner@123");

  adminToken = await getToken("admin@test.com", "Marjanahalli@123");

  const temporaryOwner = await createTemporaryOwner();

  temporaryOwnerUserId = temporaryOwner.user.id;
  temporaryOwnerHallOwnerId = temporaryOwner.hallOwner.id;

  temporaryOwnerToken = await getToken(
    temporaryOwner.email,
    temporaryOwner.password,
  );

  const anotherCustomer = await createTemporaryCustomer();

  anotherCustomerUserId = anotherCustomer.user.id;

  anotherCustomerToken = await getToken(
    anotherCustomer.email,
    anotherCustomer.password,
  );
}, 30000);

afterAll(async () => {
  await db.orm.public.HallOwner.where({
    id: temporaryOwnerHallOwnerId,
  }).delete();

  await db.orm.public.User.where({
    id: temporaryOwnerUserId,
  }).delete();

  await db.orm.public.User.where({
    id: anotherCustomerUserId,
  }).delete();
});

describe("Booking Access API", () => {
  it("should allow a customer to view their own booking", async () => {
    const response = await request(app)
      .get("/bookings/1")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      userId: 11,
      hallId: 5,
      status: "CONFIRMED",
    });
  });

  it("should reject a customer from viewing another customer's booking", async () => {
    const response = await request(app)
      .get("/bookings/1")
      .set("Authorization", `Bearer ${anotherCustomerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("You can only view your own bookings");
  });

  it("should allow the owner of the hall to view its bookings", async () => {
    const response = await request(app)
      .get("/bookings/hall/5")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should reject another owner from viewing bookings for a different owner's hall", async () => {
    const response = await request(app)
      .get("/bookings/hall/5")
      .set("Authorization", `Bearer ${temporaryOwnerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "You can only view bookings for your own halls",
    );
  }, 10000);

  it("should allow an admin to view all bookings", async () => {
    const response = await request(app)
      .get("/bookings")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should reject an unauthenticated booking access request", async () => {
    const response = await request(app).get("/bookings/1");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authorization token required");
  });

  it("should reject an invalid booking ID", async () => {
    const response = await request(app)
      .get("/bookings/abc")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should return 404 for a non-existent booking", async () => {
    const response = await request(app)
      .get("/bookings/999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Booking not found");
  });

  it("should allow a customer to view their own bookings", async () => {
    const response = await request(app)
      .get("/bookings/my")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);

    expect(
      response.body.some((booking: { id: number }) => booking.id === 1),
    ).toBe(true);
  });

  it("should allow an admin to update a booking status", async () => {
    const booking = await createTemporaryBooking();

    try {
      const response = await request(app)
        .patch(`/bookings/${booking.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "CONFIRMED",
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(booking.id);
      expect(response.body.status).toBe("CONFIRMED");
    } finally {
      await db.orm.public.Booking.where({
        id: booking.id,
      }).delete();
    }
  }, 15000);

  it("should allow the hall owner to update a booking status", async () => {
    const booking = await createTemporaryBooking();

    try {
      const response = await request(app)
        .patch(`/bookings/${booking.id}/status`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          status: "CONFIRMED",
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(booking.id);
      expect(response.body.status).toBe("CONFIRMED");
    } finally {
      await db.orm.public.Booking.where({
        id: booking.id,
      }).delete();
    }
  }, 15000);

  it("should reject a different owner from updating a booking", async () => {
    const booking = await createTemporaryBooking();

    try {
      const response = await request(app)
        .patch(`/bookings/${booking.id}/status`)
        .set("Authorization", `Bearer ${temporaryOwnerToken}`)
        .send({
          status: "CONFIRMED",
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "You can only update bookings for your own halls",
      );
    } finally {
      await db.orm.public.Booking.where({
        id: booking.id,
      }).delete();
    }
  }, 15000);

  it("should reject a customer from updating booking status", async () => {
    const booking = await createTemporaryBooking();

    try {
      const response = await request(app)
        .patch(`/bookings/${booking.id}/status`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          status: "CONFIRMED",
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Access denied");
    } finally {
      await db.orm.public.Booking.where({
        id: booking.id,
      }).delete();
    }
  });

  it("should allow a customer to delete their own temporary booking", async () => {
    const booking = await createTemporaryBooking();

    try {
      const response = await request(app)
        .delete(`/bookings/${booking.id}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Booking deleted successfully");

      const deletedBooking = await db.orm.public.Booking.where({
        id: booking.id,
      }).first();

      expect(deletedBooking).toBeNull();
    } catch (error) {
      await db.orm.public.Booking.where({
        id: booking.id,
      }).delete();

      throw error;
    }
  }, 15000);

  it("should reject a customer from deleting another customer's booking", async () => {
    const response = await request(app)
      .delete("/bookings/1")
      .set("Authorization", `Bearer ${anotherCustomerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("You can only delete your own bookings");
  }, 10000);
});
