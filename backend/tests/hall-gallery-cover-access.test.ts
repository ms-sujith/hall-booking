import { describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/services/hall.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../src/services/hall.service")>();

  return {
    ...original,
    getHallById: vi.fn().mockResolvedValue({
      id: 999,
      ownerId: 999,
      name: "Another Owner Test Hall",
    }),
    isHallOwnedByUser: vi.fn().mockResolvedValue(false),
  };
});

import app from "../src/app";

const endpoint = "/halls/999/images/1/cover";

describe("Hall Gallery Cover Access Security", () => {
  it("rejects unauthenticated cover updates", async () => {
    const response = await request(app).patch(endpoint);

    expect(response.status).toBe(401);
  });

  it("rejects CUSTOMER cover updates", async () => {
    const login = await request(app)
      .post("/auth/login")
      .send({
        email: "suresh@test.com",
        password: "Suresh@123",
      });

    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("CUSTOMER");

    const response = await request(app)
      .patch(endpoint)
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(response.status).toBe(403);
  });

  it("rejects an OWNER updating another owner's hall", async () => {
    const login = await request(app)
      .post("/auth/login")
      .send({
        email: "owner@test.com",
        password: "Owner@123",
      });

    expect(login.status).toBe(200);

    const response = await request(app)
      .patch(endpoint)
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "You cannot modify another owner's hall",
    });
  });
});