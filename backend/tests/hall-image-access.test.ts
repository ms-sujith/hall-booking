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
    updateHallImage: vi.fn(),
  };
});

import app from "../src/app";

describe("Hall Image Ownership Security", () => {
  it("rejects an OWNER uploading to another owner's hall", async () => {
    const login = await request(app).post("/auth/login").send({
      email: "owner@test.com",
      password: "Owner@123",
    });

    expect(login.status).toBe(200);

    const response = await request(app)
      .post("/halls/999/image")
      .set("Authorization", `Bearer ${login.body.token}`)
      .attach("image", Buffer.from([0xff, 0xd8, 0xff, 0xd9]), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "You cannot modify another owner's hall",
    });
  });
});
