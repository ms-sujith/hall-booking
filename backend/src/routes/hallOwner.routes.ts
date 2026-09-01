import { Router } from "express";
import {
  createHallOwnerProfile,
  getHallOwnerProfile,
  getHallsByOwnerController,
} from "../controllers/hallOwner.controller";
const router = Router();
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

// ====================
// Create HallOwner Profile
// POST /hall-owners
// ====================

router.post(
  "/",
  authenticateToken,
  authorizeRoles("OWNER", "ADMIN"),
  createHallOwnerProfile,
);
// ====================
// Get HallOwner By User ID
// GET /hall-owners/:userId
// ====================

router.get("/:userId", getHallOwnerProfile);
// ====================
// Get All Halls By Owner
// GET /hall-owners/:userId/halls
// ====================

router.get("/:userId/halls", getHallsByOwnerController);

export default router;
