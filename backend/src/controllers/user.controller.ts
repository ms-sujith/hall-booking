import type { Request, Response } from "express";

import {
  getAllUsers,
  getUserById as findUserById,
  createNewUser,
  hashPassword,
} from "../services/user.service";
import { createUserSchema } from "../validators/user.validator";

// ====================
// Get All Users
// GET /users
// ====================

export async function getUsers(_req: Request, res: Response) {
  try {
    const users = await getAllUsers();

    console.log("Users fetched successfully!");

    return res.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
}

// ====================
// Get User By ID
// GET /users/:id
// ====================

export async function getUserById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const authenticatedUser = (req as any).user;

    if (!authenticatedUser) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (authenticatedUser.role !== "ADMIN" && authenticatedUser.userId !== id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const user = await findUserById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.log(`User ${id} fetched successfully!`);

    return res.json(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);

    return res.status(500).json({
      message: "Failed to fetch user",
    });
  }
}

// ====================
// Create User
// POST /users
// ====================

export async function createUser(req: Request, res: Response) {
  try {
    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { name, email, password } = result.data;

    const passwordHash = await hashPassword(password);

    const user = await createNewUser(name, email, passwordHash);

    console.log("User created successfully!");

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(201).json(safeUser);
  } catch (error: any) {
    console.error("Failed to create user:", error);

    if (error?.sqlState === "23505") {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create user",
    });
  }
}
