import type { Request, Response } from "express";

import {
  getUserByEmail,
  comparePassword,
  generateToken,
} from "../services/user.service";

// ====================
// Login
// POST /auth/login
// ====================

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        message: "Password not set for this user",
      });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    const token = generateToken(user.id, user.role);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
}
