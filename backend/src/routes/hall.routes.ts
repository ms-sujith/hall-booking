import { Router } from "express";
import {
  createHallController,
  getHallsController,
  getHallByIdController,
 updateHallController,
} from "../controllers/hall.controller";
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

//PUT Hall By ID
//Hall update details

router.put("/:id", updateHallController);

export default router;