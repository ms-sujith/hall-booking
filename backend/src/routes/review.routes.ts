import { Router } from "express";

import {
  createReviewController,
  getReviewsController,
  getMyReviewsController,
  getReviewByIdController,
  getReviewsByHallController,
  updateReviewController,
  deleteReviewController,
} from "../controllers/review.controller";

import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// ====================
// Create Review
// POST /reviews
// CUSTOMER only
// ====================

router.post(
  "/",
  authenticateToken,
  authorizeRoles("CUSTOMER"),
  createReviewController,
);

// ====================
// Get All Reviews
// GET /reviews
// ADMIN only
// ====================

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getReviewsController,
);

// ====================
// Get My Reviews
// GET /reviews/my
// CUSTOMER only
// ====================

router.get(
  "/my",
  authenticateToken,
  authorizeRoles("CUSTOMER"),
  getMyReviewsController,
);

// ====================
// Get Reviews By Hall
// GET /reviews/hall/:hallId
// CUSTOMER / OWNER / ADMIN
// ====================

router.get(
  "/hall/:hallId",
  authenticateToken,
  authorizeRoles("CUSTOMER", "OWNER", "ADMIN"),
  getReviewsByHallController,
);

// ====================
// Get Review By ID
// GET /reviews/:id
// CUSTOMER / OWNER / ADMIN
// ====================

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("CUSTOMER", "OWNER", "ADMIN"),
  getReviewByIdController,
);

// ====================
// Update Review
// PUT /reviews/:id
// CUSTOMER only
// ====================

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("CUSTOMER"),
  updateReviewController,
);

// ====================
// Delete Review
// DELETE /reviews/:id
// CUSTOMER / ADMIN
// ====================

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("CUSTOMER", "ADMIN"),
  deleteReviewController,
);

export default router;
