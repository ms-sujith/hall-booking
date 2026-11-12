import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app";

describe("Public Hall Gallery GET API", () => {
  it("returns gallery images for an existing hall", async () => {
    const response = await request(app)
      .get("/halls/5/images");

    expect(response.status).toBe(200);
    expect(response.body.hallId).toBe(5);
    expect(response.body.images).toBeInstanceOf(Array);

    for (const image of response.body.images) {
      expect(image).toHaveProperty("id");
      expect(image).toHaveProperty("imageUrl");
      expect(image).toHaveProperty("isCover");
      expect(image).toHaveProperty("createdAt");
      expect(image).not.toHaveProperty("storagePath");
      expect(image).not.toHaveProperty("hallId");
    }
    expect(response.body.count).toBe(
      response.body.images.length,
    );
  });

  it("rejects an invalid hall ID", async () => {
    const response = await request(app)
      .get("/halls/abc/images");

    expect(response.status).toBe(400);
  });

  it("returns 404 for a nonexistent hall", async () => {
    const response = await request(app)
      .get("/halls/999999999/images");

    expect(response.status).toBe(404);
  });
});