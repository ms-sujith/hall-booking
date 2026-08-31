import { db } from "../db";

// ====================
// Create Hall
// ====================

export async function createHall(
  ownerId: number,
  name: string,
  description: string | null,
  address: string,
  city: string,
  capacity: number,
  price: string,
  imageUrl: string | null,
  amenities: string | null
) {
  const hall = await db.orm.public.Hall.create({
    ownerId,
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

  const ownerHalls = halls.filter(
    (hall) => hall.ownerId === ownerId
  );

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
  amenities: string | null
) {
  const updatedHall = await db.orm.public.Hall
    .where({ id })
    .update({
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
  const deletedHall = await db.orm.public.Hall
    .where({ id })
    .delete();

  return deletedHall;
}