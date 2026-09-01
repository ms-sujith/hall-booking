import { Router } from "express";

import {
  createBookingController,
  getBookingsController,
  getBookingByIdController,
  getMyBookingsController,
  getBookingsByHallController,
  updateBookingStatusController,
  deleteBookingController,
} from "../controllers/booking.controller";

import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// ====================
// Create Booking
// POST /bookings
// CUSTOMER only
// ====================

router.post(
  "/",
  authenticateToken,
  authorizeRoles("CUSTOMER"),
  createBookingController,
);

// ====================
// Get All Bookings
// GET /bookings
// ADMIN only
// ====================

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getBookingsController,
);

// ====================
// Get My Bookings
// GET /bookings/my
// CUSTOMER only
// ====================

router.get(
  "/my",
  authenticateToken,
  authorizeRoles("CUSTOMER"),
  getMyBookingsController,
);

// ====================
// Get Bookings By Hall
// GET /bookings/hall/:hallId
// OWNER / ADMIN
// ====================

router.get(
  "/hall/:hallId",
  authenticateToken,
  authorizeRoles("OWNER", "ADMIN"),
  getBookingsByHallController,
);

// ====================
// Get Booking By ID
// GET /bookings/:id
// CUSTOMER → own booking
// OWNER → own hall booking
// ADMIN → any booking
// ====================

router.get("/:id", authenticateToken, getBookingByIdController);
// ====================
// Update Booking Status
// PATCH /bookings/:id/status
// OWNER / ADMIN
// ====================

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("OWNER", "ADMIN"),
  updateBookingStatusController,
);

// CUSTOMER → own booking only
// OWNER    → own hall bookings only
// ADMIN    → any booking
router.delete("/:id", authenticateToken, deleteBookingController);

export default router;
