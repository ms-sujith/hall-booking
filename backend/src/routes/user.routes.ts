import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
} from "../controllers/user.controller";

const router = Router();


// ====================
// Get All Users
// GET /users
// ====================

router.get("/", getUsers);


// ====================
// Get User By ID
// GET /users/:id
// ====================

router.get("/:id", getUserById);


// ====================
// Create User
// POST /users
// ====================

router.post("/", createUser);


export default router;