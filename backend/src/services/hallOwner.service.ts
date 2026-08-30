import { db } from "../db";

// ====================
// Create HallOwner Profile
// ====================

export async function createHallOwner(
  userId: number,
  phone?: string
) {
  const hallOwner = await db.orm.public.HallOwner.create({
    userId,
    phone: phone ?? null,
  });

  return hallOwner;
}
// ====================
// Get HallOwner By User ID
// ====================

export async function getHallOwnerByUserId(userId: number) {
  const hallOwners = await db.orm.public.HallOwner.all();

  const hallOwner = hallOwners.find(
    (hallOwner) => hallOwner.userId === userId
  );

  return hallOwner;
}