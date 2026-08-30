import type { Request, Response } from "express";
import {
  createHallOwner,
  getHallOwnerByUserId,
} from "../services/hallOwner.service";
// ====================
// Create HallOwner Profile
// ====================

export async function createHallOwnerProfile(
  req: Request,
  res: Response
) {
  try {
    const { userId, phone } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const hallOwner = await createHallOwner(
      Number(userId),
      phone
    );

    console.log("HallOwner profile created successfully!");

    return res.status(201).json(hallOwner);
  } catch (error: any) {
    console.error("Failed to create HallOwner:", error);

    if (error?.sqlState === "23505") {
      return res.status(409).json({
        message: "HallOwner profile already exists for this user",
      });
    }

    return res.status(500).json({
      message: "Failed to create HallOwner profile",
    });
  }
}

// ====================
// Get HallOwner By User ID
// ====================

export async function getHallOwnerProfile(
  req: Request,
  res: Response
) {
  try {
    const userId = Number(req.params.userId);

    if (Number.isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const hallOwner = await getHallOwnerByUserId(userId);

    if (!hallOwner) {
      return res.status(404).json({
        message: "HallOwner profile not found",
      });
    }

    console.log(
      `HallOwner profile for user ${userId} fetched successfully!`
    );

    return res.json(hallOwner);
  } catch (error) {
    console.error("Failed to fetch HallOwner profile:", error);

    return res.status(500).json({
      message: "Failed to fetch HallOwner profile",
    });
  }
}