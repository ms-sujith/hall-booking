import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
} from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// ====================
// Get All Users
// GET /users
// ====================

router.get("/", authenticateToken, authorizeRoles("ADMIN"), getUsers);
// ====================
// Get User By ID
// GET /users/:id
// ====================

router.get("/:id", authenticateToken, getUserById);
// ====================
// Create User
// POST /users
// ====================

router.post("/", createUser);

export default router;
