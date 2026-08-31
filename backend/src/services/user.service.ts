import { db } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
  passwordHash: string,
  role?: "CUSTOMER" | "OWNER",
) {
  const user = await db.orm.public.User.create({
    name,
    email,
    passwordHash,
    role: role ?? "CUSTOMER",
  });

  return user;
}
// ====================
// Hash Password
// ====================

export async function hashPassword(password: string) {
  const passwordHash = await bcrypt.hash(password, 10);

  return passwordHash;
}

// ====================
// Find User By Email
// ====================

export async function getUserByEmail(email: string) {
  const user = await db.orm.public.User.where({ email }).first();

  return user;
}

// ====================
// Compare Password
// ====================

export async function comparePassword(password: string, passwordHash: string) {
  const isMatch = await bcrypt.compare(password, passwordHash);

  return isMatch;
}
// ====================
// Generate JWT Token
// ====================

export function generateToken(
  userId: number,
  role: "CUSTOMER" | "OWNER" | "ADMIN",
) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign(
    {
      userId,
      role,
    },
    secret,
    {
      expiresIn: "1d",
    },
  );

  return token;
}
