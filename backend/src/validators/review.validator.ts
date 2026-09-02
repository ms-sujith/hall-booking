import { z } from "zod";

export const createReviewSchema = z.object({
  hallId: z.coerce
    .number()
    .int("hallId must be a whole number")
    .positive("hallId must be greater than 0"),

  rating: z.coerce
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),

  comment: z
    .string()
    .trim()
    .max(2000, "Comment must not exceed 2000 characters")
    .nullable()
    .optional(),
});

export const reviewIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int("Review ID must be a whole number")
    .positive("Review ID must be greater than 0"),
});

export const reviewHallIdParamSchema = z.object({
  hallId: z.coerce
    .number()
    .int("Hall ID must be a whole number")
    .positive("Hall ID must be greater than 0"),
});

export const updateReviewSchema = z
  .object({
    rating: z.coerce
      .number()
      .int("Rating must be a whole number")
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5")
      .optional(),

    comment: z
      .string()
      .trim()
      .max(2000, "Comment must not exceed 2000 characters")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => data.rating !== undefined || data.comment !== undefined,
    {
      message: "Rating or comment is required",
    },
  );
