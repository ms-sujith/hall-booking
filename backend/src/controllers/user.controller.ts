import type { Request, Response } from "express";

import {
  getAllUsers,
  getUserById as findUserById,
  createNewUser,
  hashPassword,
} from "../services/user.service";

// ====================
// Get All Users
// ====================

export async function getUsers(req: Request, res: Response) {
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
// ====================

export async function getUserById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
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
// ====================

export async function createUser(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await createNewUser(name, email, passwordHash, role);

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
