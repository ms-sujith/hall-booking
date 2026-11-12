import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  rawSql: vi.fn(),
}));

vi.mock("../src/db", () => ({
  db: {
    transaction: mocks.transaction,
    raw: {
      sql: mocks.rawSql,
    },
  },
}));

import { setHallGalleryCover } from "../src/services/hallGallery.service";

describe("Hall Gallery Cover Transaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.rawSql.mockImplementation(() => ({
      returnsRow: () => ({
        build: () => ({ kind: "mock-lock-plan" }),
      }),
    }));
  });

  it("updates cover flags and Hall.imageUrl in one transaction", async () => {
    const galleryUpdate = vi.fn().mockResolvedValue(undefined);
    const hallUpdate = vi.fn().mockResolvedValue(undefined);

    const images = [
      { id: 10, hallId: 5, imageUrl: "old.jpg", isCover: true },
      { id: 11, hallId: 5, imageUrl: "new.jpg", isCover: false },
    ];

    const tx = {
      query: vi.fn().mockReturnValue(
        (async function* () {
          yield { id: 5 };
        })(),
      ),
      orm: {
        public: {
          Hall: {
            where: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue({ id: 5 }),
              update: hallUpdate,
            }),
          },
          HallImage: {
            where: vi.fn((filter: { id?: number; hallId?: number }) => ({
              first: vi.fn().mockResolvedValue(
                filter.id === 11 ? images[1] : null,
              ),
              all: vi.fn().mockResolvedValue(images),
              update: galleryUpdate,
            })),
          },
        },
      },
    };

    mocks.transaction.mockImplementation(async (callback) => callback(tx));

    const result = await setHallGalleryCover(5, 11);

    expect(galleryUpdate).toHaveBeenCalledWith({ isCover: false });
    expect(galleryUpdate).toHaveBeenCalledWith({ isCover: true });
    expect(hallUpdate).toHaveBeenCalledWith({ imageUrl: "new.jpg" });
    expect(result.imageId).toBe(11);
    expect(result.isCover).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects an image that does not belong to the hall", async () => {
    const update = vi.fn();

    const tx = {
      query: vi.fn().mockReturnValue(
        (async function* () {
          yield { id: 5 };
        })(),
      ),
      orm: {
        public: {
          Hall: {
            where: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue({ id: 5 }),
              update,
            }),
          },
          HallImage: {
            where: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
              all: vi.fn(),
              update,
            }),
          },
        },
      },
    };

    mocks.transaction.mockImplementation(async (callback) => callback(tx));

    await expect(setHallGalleryCover(5, 99)).rejects.toThrow(
      "GALLERY_IMAGE_NOT_FOUND",
    );

    expect(update).not.toHaveBeenCalled();
  });

  it("propagates a database update failure", async () => {
    const tx = {
      query: vi.fn().mockReturnValue(
        (async function* () {
          yield { id: 5 };
        })(),
      ),
      orm: {
        public: {
          Hall: {
            where: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue({ id: 5 }),
              update: vi.fn().mockRejectedValue(
                new Error("Database update failed"),
              ),
            }),
          },
          HallImage: {
            where: vi.fn((filter: { id?: number; hallId?: number }) => ({
              first: vi.fn().mockResolvedValue({
                id: 11,
                hallId: 5,
                imageUrl: "new.jpg",
                isCover: false,
              }),
              all: vi.fn().mockResolvedValue([]),
              update: vi.fn().mockResolvedValue(undefined),
            })),
          },
        },
      },
    };

    mocks.transaction.mockImplementation(async (callback) => callback(tx));

    await expect(setHallGalleryCover(5, 11)).rejects.toThrow(
      "Database update failed",
    );
  });
});