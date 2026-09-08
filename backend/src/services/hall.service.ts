import { db } from "../db";

// ====================
// Create Hall
// ====================

export async function createHall(
  ownerId: number,
  createdByUserId: number,
  name: string,
  description: string | null,
  address: string,
  city: string,
  capacity: number,
  price: string,
  imageUrl: string | null,
  amenities: string | null,
) {
  const hall = await db.orm.public.Hall.create({
    ownerId,
    createdByUserId,
    name,
    description,
    address,
    city,
    capacity,
    price,
    imageUrl,
    amenities,
  });

  return hall;
}

// ====================
// Get All Halls
// ====================

export async function getHalls() {
  const halls = await db.orm.public.Hall.all();

  return halls;
}

// ====================
// Get Admin Halls
// Includes Owner + Creator Information
// ====================

export async function getAdminHalls() {
  const halls = await db.orm.public.Hall.all();
  const hallOwners = await db.orm.public.HallOwner.all();
  const users = await db.orm.public.User.all();

  const adminHalls = halls.map((hall) => {
    // ====================
    // Find Hall Owner
    // ====================

    const hallOwner = hallOwners.find((owner) => owner.id === hall.ownerId);

    const ownerUser = hallOwner
      ? users.find((user) => user.id === hallOwner.userId)
      : undefined;

    // ====================
    // Find Hall Creator
    // ====================

    const creatorUser = hall.createdByUserId
      ? users.find((user) => user.id === hall.createdByUserId)
      : undefined;

    return {
      ...hall,

      owner: ownerUser
        ? {
            id: ownerUser.id,
            name: ownerUser.name,
            email: ownerUser.email,
            role: ownerUser.role,
          }
        : null,

      creator: creatorUser
        ? {
            id: creatorUser.id,
            name: creatorUser.name,
            email: creatorUser.email,
            role: creatorUser.role,
          }
        : null,
    };
  });

  return adminHalls;
}

// ====================
// Get Hall By ID
// ====================

export async function getHallById(id: number) {
  const halls = await db.orm.public.Hall.all();

  const hall = halls.find((hall) => hall.id === id);

  return hall;
}

// ====================
// Get All Halls By Owner ID
// ====================

export async function getHallsByOwnerId(ownerId: number) {
  const halls = await db.orm.public.Hall.all();

  const ownerHalls = halls.filter((hall) => hall.ownerId === ownerId);

  return ownerHalls;
}

// ====================
// Update Hall
// ====================

export async function updateHall(
  id: number,
  name: string,
  description: string | null,
  address: string,
  city: string,
  capacity: number,
  price: string,
  imageUrl: string | null,
  amenities: string | null,
) {
  const updatedHall = await db.orm.public.Hall.where({ id }).update({
    name,
    description,
    address,
    city,
    capacity,
    price,
    imageUrl,
    amenities,
  });

  return updatedHall;
}

// ====================
// Delete Hall
// ====================

export async function deleteHall(id: number) {
  const deletedHall = await db.orm.public.Hall.where({ id }).delete();

  return deletedHall;
}

// ====================
// Check Hall Ownership
// ====================

export async function isHallOwnedByUser(hallId: number, userId: number) {
  const hall = await getHallById(hallId);

  if (!hall) {
    return false;
  }

  const hallOwners = await db.orm.public.HallOwner.all();

  const hallOwner = hallOwners.find((owner) => owner.id === hall.ownerId);

  if (!hallOwner) {
    return false;
  }

  return hallOwner.userId === userId;
}
