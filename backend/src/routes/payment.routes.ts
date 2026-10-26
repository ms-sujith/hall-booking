import { Router } from "express";

import {
  createPaymentController,
  getPaymentsController,
  getMyPaymentsController,
  getPaymentByIdController,
  getPaymentByBookingController,
  updatePaymentStatusController,
  deletePaymentController,
} from "../controllers/payment.controller";

import {
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
} from "../controllers/razorpay.controller";

import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// ====================
// Create Payment
// POST /payments
// CUSTOMER only
// ====================

router.post(
  "/",
  authenticateToken,
  authorizeRoles("CUSTOMER"),
  createPaymentController,
);

// ====================
// Create Razorpay Order
// POST /payments/razorpay/order
// CUSTOMER only
// ====================

router.post(
  "/razorpay/order",
  authenticateToken,
  authorizeRoles("CUSTOMER"),
  createRazorpayOrderController,
);

// ====================
// Verify Razorpay Payment
// POST /payments/razorpay/verify
// CUSTOMER only
// ====================

router.post(
  "/razorpay/verify",
  authenticateToken,
  authorizeRoles("CUSTOMER"),
  verifyRazorpayPaymentController,
);

// ====================
// Get All Payments
// GET /payments
// ADMIN only
// ====================

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getPaymentsController,
);

// ====================
// Get My Payments
// GET /payments/my
// CUSTOMER only
// ====================

router.get(
  "/my",
  authenticateToken,
  authorizeRoles("CUSTOMER"),
  getMyPaymentsController,
);

// ====================
// Get Payment By Booking
// GET /payments/booking/:bookingId
// CUSTOMER / OWNER / ADMIN
// ====================

router.get(
  "/booking/:bookingId",
  authenticateToken,
  authorizeRoles("CUSTOMER", "OWNER", "ADMIN"),
  getPaymentByBookingController,
);

// ====================
// Get Payment By ID
// GET /payments/:id
// CUSTOMER / ADMIN
// ====================

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("CUSTOMER", "ADMIN"),
  getPaymentByIdController,
);

// ====================
// Update Payment Status
// PATCH /payments/:id/status
// ADMIN only
// ====================

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updatePaymentStatusController,
);

// ====================
// Delete Payment
// DELETE /payments/:id
// ADMIN only
// ====================

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  deletePaymentController,
);

export default router;
