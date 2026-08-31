import type { Request, Response } from "express";

import {
  createHall,
  getHalls,
  getHallById,
  updateHall,
  deleteHall,
  isHallOwnedByUser,
} from "../services/hall.service";

// ====================
// Create Hall
// POST /halls
// ====================

export async function createHallController(req: Request, res: Response) {
  try {
    const {
      ownerId,
      name,
      description,
      address,
      city,
      capacity,
      price,
      imageUrl,
      amenities,
    } = req.body;

    if (
      !ownerId ||
      !name ||
      !address ||
      !city ||
      !capacity ||
      price === undefined
    ) {
      return res.status(400).json({
        message:
          "ownerId, name, address, city, capacity and price are required",
      });
    }

    const hall = await createHall(
      Number(ownerId),
      name,
      description ?? null,
      address,
      city,
      Number(capacity),
      String(price),
      imageUrl ?? null,
      amenities ?? null,
    );

    console.log("Hall created successfully!");

    return res.status(201).json(hall);
  } catch (error) {
    console.error("Failed to create hall:", error);

    return res.status(500).json({
      message: "Failed to create hall",
    });
  }
}

// ====================
// Get All Halls
// GET /halls
// ====================

export async function getHallsController(req: Request, res: Response) {
  try {
    const halls = await getHalls();

    console.log("Halls fetched successfully!");

    return res.json(halls);
  } catch (error) {
    console.error("Failed to fetch halls:", error);

    return res.status(500).json({
      message: "Failed to fetch halls",
    });
  }
}

// ====================
// Get Hall By ID
// GET /halls/:id
// ====================

export async function getHallByIdController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid hall ID",
      });
    }

    const hall = await getHallById(id);

    if (!hall) {
      return res.status(404).json({
        message: "Hall not found",
      });
    }

    console.log(`Hall ${id} fetched successfully!`);

    return res.json(hall);
  } catch (error) {
    console.error("Failed to fetch hall:", error);

    return res.status(500).json({
      message: "Failed to fetch hall",
    });
  }
}

// ====================
// Update Hall
// PUT /halls/:id
// ====================

export async function updateHallController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid hall ID",
      });
    }

    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const hall = await getHallById(id);

    if (!hall) {
      return res.status(404).json({
        message: "Hall not found",
      });
    }

    if (user.role === "CUSTOMER") {
      return res.status(403).json({
        message: "Only owners and admins can update halls",
      });
    }

    if (user.role === "OWNER") {
      const isOwner = await isHallOwnedByUser(id, user.userId);

      if (!isOwner) {
        return res.status(403).json({
          message: "You can only update your own halls",
        });
      }
    }

    const {
      name,
      description,
      address,
      city,
      capacity,
      price,
      imageUrl,
      amenities,
    } = req.body;

    if (!name || !address || !city || !capacity || price === undefined) {
      return res.status(400).json({
        message: "name, address, city, capacity and price are required",
      });
    }

    const updatedHall = await updateHall(
      id,
      name,
      description ?? null,
      address,
      city,
      Number(capacity),
      String(price),
      imageUrl ?? null,
      amenities ?? null,
    );

    console.log(`Hall ${id} updated successfully!`);

    return res.json(updatedHall);
  } catch (error) {
    console.error("Failed to update hall:", error);

    return res.status(500).json({
      message: "Failed to update hall",
    });
  }
}

// ====================
// Delete Hall
// DELETE /halls/:id
// ====================

export async function deleteHallController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid hall ID",
      });
    }

    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const hall = await getHallById(id);

    if (!hall) {
      return res.status(404).json({
        message: "Hall not found",
      });
    }

    if (user.role === "CUSTOMER") {
      return res.status(403).json({
        message: "Only owners and admins can delete halls",
      });
    }

    if (user.role === "OWNER") {
      const isOwner = await isHallOwnedByUser(id, user.userId);

      if (!isOwner) {
        return res.status(403).json({
          message: "You can only delete your own halls",
        });
      }
    }

    const deletedHall = await deleteHall(id);

    return res.json({
      message: "Hall deleted successfully",
      hall: deletedHall,
    });
  } catch (error) {
    console.error("Failed to delete hall:", error);

    return res.status(500).json({
      message: "Failed to delete hall",
    });
  }
}
