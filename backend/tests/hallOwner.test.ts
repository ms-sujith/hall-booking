import { describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app";
import { db } from "../src/db";

async function getToken(email: string, password: string) {
  const response = await request(app)
    .post("/auth/login")
    .send({
      email,
      password,
    });

  expect(response.status).toBe(200);
  expect(response.body.token).toBeTypeOf("string");

  return response.body.token as string;
}

async function createTemporaryOwner() {
  const email = `owner-test-${Date.now()}@example.com`;
  const password = "OwnerTest@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.orm.public.User.create({
    name: "Temporary Owner",
    email,
    passwordHash,
    role: "OWNER",
  });

  return {
    user,
    email,
    password,
  };
}

describe("HallOwner API", () => {
  it("should return a public HallOwner profile without exposing phone", async () => {
    const response = await request(app).get("/hall-owners/12");

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      id: 2,
      userId: 12,
    });

    expect(response.body.phone).toBeUndefined();
  });

  it("should return halls belonging to a HallOwner", async () => {
    const response = await request(app).get("/hall-owners/12/halls");

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should reject an invalid user ID for HallOwner lookup", async () => {
    const response = await request(app).get("/hall-owners/abc");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid user ID");
  });

  it("should return 404 when the HallOwner profile does not exist", async () => {
    const response = await request(app).get("/hall-owners/999999");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("HallOwner profile not found");
  });

  it("should reject an invalid user ID when fetching owner's halls", async () => {
    const response = await request(app).get("/hall-owners/abc/halls");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid user ID");
  });

  it("should reject an unauthenticated HallOwner creation request", async () => {
    const response = await request(app)
      .post("/hall-owners")
      .send({
        userId: 12,
        phone: "9999999999",
      });

    expect(response.status).toBe(401);
  });

  it("should reject a customer from creating a HallOwner profile", async () => {
    const customerToken = await getToken(
      "suresh@test.com",
      "Suresh@123",
    );

    const response = await request(app)
      .post("/hall-owners")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        userId: 11,
        phone: "9999999999",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  it("should reject a duplicate HallOwner profile", async () => {
    const ownerToken = await getToken(
      "owner@test.com",
      "Owner@123",
    );

    const response = await request(app)
      .post("/hall-owners")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        phone: "9999999999",
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      "HallOwner profile already exists for this user",
    );
  });

  it("should allow an OWNER to create a HallOwner profile only for themselves", async () => {
    const temporaryOwner = await createTemporaryOwner();

    try {
      const ownerToken = await getToken(
        temporaryOwner.email,
        temporaryOwner.password,
      );

      const response = await request(app)
        .post("/hall-owners")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          userId: 10,
          phone: "9999999999",
        });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(temporaryOwner.user.id);
      expect(response.body.phone).toBe("9999999999");

      const hallOwnerId = response.body.id;

      await db.orm.public.HallOwner.where({
        id: hallOwnerId,
      }).delete();
    } finally {
      await db.orm.public.HallOwner.where({
        userId: temporaryOwner.user.id,
      }).delete();

      await db.orm.public.User.where({
        id: temporaryOwner.user.id,
      }).delete();
    }
  });

  it("should allow ADMIN to create a HallOwner profile for an OWNER", async () => {
    const temporaryOwner = await createTemporaryOwner();

    try {
      const adminToken = await getToken(
        "admin@test.com",
        "Marjanahalli@123",
      );

      const response = await request(app)
        .post("/hall-owners")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userId: temporaryOwner.user.id,
          phone: "8888888888",
        });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(temporaryOwner.user.id);
      expect(response.body.phone).toBe("8888888888");
    } finally {
      await db.orm.public.HallOwner.where({
        userId: temporaryOwner.user.id,
      }).delete();

      await db.orm.public.User.where({
        id: temporaryOwner.user.id,
      }).delete();
    }
  });

  it("should reject ADMIN creation for a CUSTOMER user", async () => {
    const adminToken = await getToken(
      "admin@test.com",
      "Marjanahalli@123",
    );

    const response = await request(app)
      .post("/hall-owners")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: 11,
        phone: "8888888888",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Only OWNER users can have a HallOwner profile",
    );
  });

  it("should reject ADMIN creation for a non-existent user", async () => {
    const adminToken = await getToken(
      "admin@test.com",
      "Marjanahalli@123",
    );

    const response = await request(app)
      .post("/hall-owners")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: 999999,
        phone: "8888888888",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });
});