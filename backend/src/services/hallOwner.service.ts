import { db } from "../db";

// ====================
// Create HallOwner Profile
// ====================

export async function createHallOwner(userId: number, phone?: string) {
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

  const hallOwner = hallOwners.find((hallOwner) => hallOwner.userId === userId);

  if (!hallOwner) {
    return null;
  }

  // Public response — do not expose phone number
  return {
    id: hallOwner.id,
    userId: hallOwner.userId,
    createdAt: hallOwner.createdAt,
    updatedAt: hallOwner.updatedAt,
  };
}
