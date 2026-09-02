import { z } from "zod";

const hallFields = {
  name: z
    .string()
    .trim()
    .min(2, "Hall name must be at least 2 characters")
    .max(150, "Hall name must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters")
    .nullable()
    .optional(),

  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(300, "Address must not exceed 300 characters"),

  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters"),

  capacity: z.coerce
    .number()
    .int("Capacity must be a whole number")
    .positive("Capacity must be greater than 0"),

  price: z.coerce
    .number()
    .finite("Price must be a valid number")
    .nonnegative("Price cannot be negative"),

  imageUrl: z
    .string()
    .trim()
    .url("Invalid image URL")
    .max(1000, "Image URL must not exceed 1000 characters")
    .nullable()
    .optional(),

  amenities: z
    .string()
    .trim()
    .max(1000, "Amenities must not exceed 1000 characters")
    .nullable()
    .optional(),
};

export const createHallSchema = z.object({
  ownerId: z.coerce
    .number()
    .int("ownerId must be a whole number")
    .positive("ownerId must be greater than 0")
    .optional(),

  ...hallFields,
});

export const updateHallSchema = z.object({
  ...hallFields,
});
