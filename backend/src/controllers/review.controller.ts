import type { Request, Response } from "express";

import {
  createReview,
  getReviews,
  getReviewById,
  getReviewsByUserId,
  getReviewsByHallId,
  updateReview,
  deleteReview,
} from "../services/review.service";

import { db } from "../db";

import {
  createReviewSchema,
  reviewIdParamSchema,
  reviewHallIdParamSchema,
  updateReviewSchema,
} from "../validators/review.validator";

// ====================
// Create Review
// POST /reviews
// CUSTOMER only
// ====================

export async function createReviewController(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result = createReviewSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { hallId, rating, comment } = result.data;
    const userId = Number(user.userId);

    // Check hall exists
    const hall = await db.orm.public.Hall.where({
      id: hallId,
    }).first();

    if (!hall) {
      return res.status(404).json({
        message: "Hall not found",
      });
    }

    // Check customer has a confirmed booking for this hall
    const confirmedBooking = await db.orm.public.Booking.where({
      userId,
      hallId,
      status: "CONFIRMED",
    }).first();

    if (!confirmedBooking) {
      return res.status(403).json({
        message: "You can only review a hall after having a confirmed booking",
      });
    }

    // One review per customer per hall
    const existingReviews = await getReviewsByUserId(userId);

    const alreadyReviewed = existingReviews.some(
      (review) => review.hallId === hallId,
    );

    if (alreadyReviewed) {
      return res.status(409).json({
        message: "You have already reviewed this hall",
      });
    }

    const review = await createReview(userId, hallId, rating, comment ?? null);

    console.log("Review created successfully!");

    return res.status(201).json(review);
  } catch (error) {
    console.error("Failed to create review:", error);

    return res.status(500).json({
      message: "Failed to create review",
    });
  }
}

// ====================
// Get All Reviews
// GET /reviews
// ADMIN only
// ====================

export async function getReviewsController(_req: Request, res: Response) {
  try {
    const reviews = await getReviews();

    return res.json(reviews);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);

    return res.status(500).json({
      message: "Failed to fetch reviews",
    });
  }
}

// ====================
// Get My Reviews
// GET /reviews/my
// CUSTOMER only
// ====================

export async function getMyReviewsController(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const reviews = await getReviewsByUserId(Number(user.userId));

    return res.json(reviews);
  } catch (error) {
    console.error("Failed to fetch user reviews:", error);

    return res.status(500).json({
      message: "Failed to fetch user reviews",
    });
  }
}

// ====================
// Get Review By ID
// GET /reviews/:id
// CUSTOMER / OWNER / ADMIN
// ====================

export async function getReviewByIdController(req: Request, res: Response) {
  try {
    const result = reviewIdParamSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const id = result.data.id;

    const review = await getReviewById(id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    return res.json(review);
  } catch (error) {
    console.error("Failed to fetch review:", error);

    return res.status(500).json({
      message: "Failed to fetch review",
    });
  }
}

// ====================
// Get Reviews By Hall
// GET /reviews/hall/:hallId
// CUSTOMER / OWNER / ADMIN
// ====================

export async function getReviewsByHallController(req: Request, res: Response) {
  try {
    const result = reviewHallIdParamSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const hallId = result.data.hallId;

    const reviews = await getReviewsByHallId(hallId);

    return res.json(reviews);
  } catch (error) {
    console.error("Failed to fetch hall reviews:", error);

    return res.status(500).json({
      message: "Failed to fetch hall reviews",
    });
  }
}

// ====================
// Update Review
// PUT /reviews/:id
// CUSTOMER only
// ====================

export async function updateReviewController(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const idResult = reviewIdParamSchema.safeParse(req.params);

    if (!idResult.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: idResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const bodyResult = updateReviewSchema.safeParse(req.body);

    if (!bodyResult.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: bodyResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const id = idResult.data.id;
    const { rating, comment } = bodyResult.data;

    const review = await getReviewById(id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    if (review.userId !== Number(user.userId)) {
      return res.status(403).json({
        message: "You can only update your own review",
      });
    }

    const updatedReview = await updateReview(id, rating, comment ?? undefined);

    return res.json(updatedReview);
  } catch (error) {
    console.error("Failed to update review:", error);

    return res.status(500).json({
      message: "Failed to update review",
    });
  }
}

// ====================
// Delete Review
// DELETE /reviews/:id
// CUSTOMER / ADMIN
// ====================

export async function deleteReviewController(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const result = reviewIdParamSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const id = result.data.id;

    const review = await getReviewById(id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    // ADMIN can delete any review
    if (user.role === "ADMIN") {
      const deletedReview = await deleteReview(id);

      return res.json({
        message: "Review deleted successfully",
        review: deletedReview,
      });
    }

    // CUSTOMER can delete only their own review
    if (user.role === "CUSTOMER") {
      if (review.userId !== Number(user.userId)) {
        return res.status(403).json({
          message: "You can only delete your own review",
        });
      }

      const deletedReview = await deleteReview(id);

      return res.json({
        message: "Review deleted successfully",
        review: deletedReview,
      });
    }

    return res.status(403).json({
      message: "Access denied",
    });
  } catch (error) {
    console.error("Failed to delete review:", error);

    return res.status(500).json({
      message: "Failed to delete review",
    });
  }
}
