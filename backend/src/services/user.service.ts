import { db } from "../db";


// ====================
// Get All Users
// ====================

export async function getAllUsers() {
  const users = await db.orm.public.User.all();

  return users;
}


// ====================
// Get User By ID
// ====================

export async function getUserById(id: number) {
  const users = await db.orm.public.User.all();

  const user = users.find((user) => user.id === id);

  return user;
}


// ====================
// Create User
// ====================

export async function createNewUser(
  name: string,
  email: string,
  role?: "CUSTOMER" | "OWNER"
) {
  const user = await db.orm.public.User.create({
    name,
    email,
    role: role ?? "CUSTOMER",
  });

  return user;
}