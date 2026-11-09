import { Router } from "express";

import {
  createHallController,
  getHallsController,
  getAdminHallsController,
  getHallByIdController,
  updateHallController,
  deleteHallController,
} from "../controllers/hall.controller";

import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

import { hallImageUpload } from "../middleware/hallImage.middleware";
import { uploadHallImageController } from "../controllers/hallImage.controller";

const router = Router();

// ====================
// Create Hall
// POST /halls
// OWNER -> own account
// ADMIN -> any owner
// ====================

router.post(
  "/",
  authenticateToken,
  authorizeRoles("OWNER", "ADMIN"),
  createHallController,
);

// ====================
// Get All Halls
// GET /halls
// Public
// ====================

router.get("/", getHallsController);

// ====================
// Get Admin Halls
// GET /halls/admin
// ADMIN only
// ====================

router.get(
  "/admin",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAdminHallsController,
);

// ====================
// Upload Hall Image
// POST /halls/:id/image
// OWNER -> own halls only
// ADMIN -> any hall
// ====================

router.post(
  "/:id/image",
  authenticateToken,
  authorizeRoles("OWNER", "ADMIN"),
  hallImageUpload,
  uploadHallImageController,
);

// ====================
// Get Hall By ID
// GET /halls/:id
// Public
// ====================

router.get("/:id", getHallByIdController);

// ====================
// Update Hall
// PUT /halls/:id
// OWNER -> own halls only
// ADMIN -> any hall
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
// OWNER -> own halls only
// ADMIN -> any hall
// ====================

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("OWNER", "ADMIN"),
  deleteHallController,
);

export default router;
