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

const testImage = Buffer.from([
  0xff, 0xd8, 0xff, 0xd9,
]);

describe("Hall Gallery Access Security", () => {
  it("rejects unauthenticated gallery uploads", async () => {
    const response = await request(app)
      .post("/halls/999/images")
      .attach("images", testImage, {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(401);
  });

  it("rejects CUSTOMER gallery uploads", async () => {
    const login = await request(app)
      .post("/auth/login")
      .send({
        email: "suresh@test.com",
        password: "Suresh@123",
      });

    expect(login.status).toBe(200);

    const response = await request(app)
      .post("/halls/999/images")
      .set("Authorization", `Bearer ${login.body.token}`)
      .attach("images", testImage, {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(403);
  });

  it("rejects an OWNER uploading to another owner's hall", async () => {
    const login = await request(app)
      .post("/auth/login")
      .send({
        email: "owner@test.com",
        password: "Owner@123",
      });

    expect(login.status).toBe(200);

    const response = await request(app)
      .post("/halls/999/images")
      .set("Authorization", `Bearer ${login.body.token}`)
      .attach("images", testImage, {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "You cannot modify another owner's hall",
    });
  });
});