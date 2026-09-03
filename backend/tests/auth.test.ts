import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";

describe("Authentication API", () => {
  it("should login successfully with valid credentials", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "suresh@test.com",
        password: "Suresh@123",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBeTypeOf("string");

    expect(response.body.user).toEqual({
      id: 11,
      name: "Suresh",
      email: "suresh@test.com",
      role: "CUSTOMER",
    });

    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("should reject login with an invalid password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "suresh@test.com",
        password: "WrongPassword@123",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Invalid email or password",
    });
  });

  it("should reject login with an unknown email", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "unknown-login@example.com",
        password: "WrongPassword@123",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Invalid email or password",
    });
  });

  it("should reject an invalid email format", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "not-an-email",
        password: "Suresh@123",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should reject a missing password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "suresh@test.com",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  it("should reject a missing email", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        password: "Suresh@123",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });
});