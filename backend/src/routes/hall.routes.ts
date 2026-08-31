import { Router } from "express";

import {
  createHallController,
  getHallsController,
  getHallByIdController,
  updateHallController,
  deleteHallController,
} from "../controllers/hall.controller";

import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// ====================
// Create Hall
// POST /halls
// ====================

router.post("/", createHallController);

// ====================
// Get All Halls
// GET /halls
// ====================

router.get("/", getHallsController);

// ====================
// Get Hall By ID
// GET /halls/:id
// ====================

router.get("/:id", getHallByIdController);

// ====================
// Update Hall
// PUT /halls/:id
// OWNER → own halls only
// ADMIN → any hall
// ====================

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("OWNER", "ADMIN"),
  updateHallController,
);

// ====================
// Delete Hall
// DELETE /halls/:id
// OWNER → own halls only
// ADMIN → any hall
// ====================

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("OWNER", "ADMIN"),
  deleteHallController,
);

export default router;
