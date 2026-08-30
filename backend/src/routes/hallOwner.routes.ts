import { Router } from "express";
import {
  createHallOwnerProfile,
  getHallOwnerProfile,
} from "../controllers/hallOwner.controller";
const router = Router();

// ====================
// Create HallOwner Profile
// POST /hall-owners
// ====================

router.post("/", createHallOwnerProfile);
// ====================
// Get HallOwner By User ID
// GET /hall-owners/:userId
// ====================

router.get("/:userId", getHallOwnerProfile);
export default router;