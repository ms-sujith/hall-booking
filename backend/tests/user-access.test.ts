import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";

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

describe("User Access API", () => {
  it("should allow an admin to get all users", async () => {
    const adminToken = await getToken(
      "admin@test.com",
      "Marjanahalli@123",
    );

    const response = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);

    if (response.body.length > 0) {
      expect(response.body[0].passwordHash).toBeUndefined();
    }
  });

  it("should reject a customer from getting all users", async () => {
    const customerToken = await getToken(
      "suresh@test.com",
      "Suresh@123",
    );

    const response = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  it("should reject an unauthenticated request to get all users", async () => {
    const response = await request(app).get("/users");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authorization token required");
  });

  it("should allow a customer to get their own profile", async () => {
    const customerToken = await getToken(
      "suresh@test.com",
      "Suresh@123",
    );

    const response = await request(app)
      .get("/users/11")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 11,
      name: "Suresh",
      email: "suresh@test.com",
      role: "CUSTOMER",
    });

    expect(response.body.passwordHash).toBeUndefined();
  });

  it("should reject a customer from viewing another user's profile", async () => {
    const customerToken = await getToken(
      "suresh@test.com",
      "Suresh@123",
    );

    const response = await request(app)
      .get("/users/12")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Access denied");
  });

  it("should allow an admin to view another user's profile", async () => {
    const adminToken = await getToken(
      "admin@test.com",
      "Marjanahalli@123",
    );

    const response = await request(app)
      .get("/users/12")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 12,
      email: "owner@test.com",
      role: "OWNER",
    });

    expect(response.body.passwordHash).toBeUndefined();
  });

  it("should reject an invalid user ID", async () => {
    const customerToken = await getToken(
      "suresh@test.com",
      "Suresh@123",
    );

    const response = await request(app)
      .get("/users/abc")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid user ID");
  });

  it("should return 404 for a non-existent user", async () => {
    const adminToken = await getToken(
      "admin@test.com",
      "Marjanahalli@123",
    );

    const response = await request(app)
      .get("/users/999999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });
});