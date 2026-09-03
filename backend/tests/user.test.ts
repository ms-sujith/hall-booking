import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";

describe("User Registration API", () => {
  it("should register a new customer successfully", async () => {
    const uniqueEmail = `test-user-${Date.now()}@example.com`;

    const response = await request(app)
      .post("/users")
      .send({
        name: "Automated Test User",
        email: uniqueEmail,
        password: "Test@12345",
      });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      name: "Automated Test User",
      email: uniqueEmail,
      role: "CUSTOMER",
    });

    expect(response.body.id).toBeTypeOf("number");
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();

    expect(response.body.passwordHash).toBeUndefined();
  });

  it("should reject an invalid email", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        name: "Automated Test User",
        email: "not-an-email",
        password: "Test@12345",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "email",
          message: "Invalid email address",
        }),
      ]),
    );
  });

  it("should reject a short password", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        name: "Automated Test User",
        email: `short-password-${Date.now()}@example.com`,
        password: "123",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "password",
          message: "Password must be at least 8 characters",
        }),
      ]),
    );
  });

  it("should reject a short name", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        name: "A",
        email: `short-name-${Date.now()}@example.com`,
        password: "Test@12345",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "name",
          message: "Name must be at least 2 characters",
        }),
      ]),
    );
  });

  it("should always create a CUSTOMER even when a privileged role is supplied", async () => {
    const uniqueEmail = `role-test-${Date.now()}@example.com`;

    const response = await request(app)
      .post("/users")
      .send({
        name: "Role Escalation Test",
        email: uniqueEmail,
        password: "Test@12345",
        role: "ADMIN",
      });

    expect(response.status).toBe(201);
    expect(response.body.role).toBe("CUSTOMER");
  });
});
