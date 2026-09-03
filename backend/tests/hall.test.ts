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

describe("Hall API", () => {
  it("should allow anyone to view all halls", async () => {
    const response = await request(app).get("/halls");

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it("should allow anyone to view a hall by ID", async () => {
    const response = await request(app).get("/halls/5");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(5);
  });

  it("should reject an invalid hall ID", async () => {
    const response = await request(app).get("/halls/abc");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Invalid hall ID",
    });
  });

  it("should reject a customer from creating a hall", async () => {
    const customerToken = await getToken(
      "suresh@test.com",
      "Suresh@123",
    );

    const response = await request(app)
      .post("/halls")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        name: "Customer Hall",
        address: "Test Address",
        city: "Hassan",
        capacity: 200,
        price: 30000,
      });

    expect(response.status).toBe(403);
  });

  it("should reject an unauthenticated hall creation request", async () => {
    const response = await request(app)
      .post("/halls")
      .send({
        name: "Unauthenticated Hall",
        address: "Test Address",
        city: "Hassan",
        capacity: 200,
        price: 30000,
      });

    expect(response.status).toBe(401);
  });

  it("should reject invalid hall data", async () => {
    const ownerToken = await getToken(
      "owner@test.com",
      "Owner@123",
    );

    const response = await request(app)
      .post("/halls")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        name: "A",
        address: "Test Address",
        city: "Hassan",
        capacity: -10,
        price: -500,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});
