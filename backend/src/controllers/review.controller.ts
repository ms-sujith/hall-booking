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

    const { hallId, rating, comment } = req.body;

    if (!hallId || rating === undefined) {
      return res.status(400).json({
        message: "hallId and rating are required",
      });
    }

    const numericHallId = Number(hallId);
    const numericRating = Number(rating);
    const userId = Number(user.userId);

    if (Number.isNaN(numericHallId)) {
      return res.status(400).json({
        message: "Invalid hall ID",
      });
    }

    if (
      Number.isNaN(numericRating) ||
      numericRating < 1 ||
      numericRating > 5 ||
      !Number.isInteger(numericRating)
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5",
      });
    }

    // Check hall exists
    const halls = await db.orm.public.Hall.all();

    const hall = halls.find((hall) => hall.id === numericHallId);

    if (!hall) {
      return res.status(404).json({
        message: "Hall not found",
      });
    }

    // Check customer has a confirmed booking for this hall
    const bookings = await db.orm.public.Booking.all();

    const hasConfirmedBooking = bookings.some(
      (booking) =>
        booking.userId === userId &&
        booking.hallId === numericHallId &&
        booking.status === "CONFIRMED",
    );

    if (!hasConfirmedBooking) {
      return res.status(403).json({
        message: "You can only review a hall after having a confirmed booking",
      });
    }

    // One review per customer per hall
    const existingReview = await getReviewsByUserId(userId);

    const alreadyReviewed = existingReview.some(
      (review) => review.hallId === numericHallId,
    );

    if (alreadyReviewed) {
      return res.status(409).json({
        message: "You have already reviewed this hall",
      });
    }

    const review = await createReview(
      userId,
      numericHallId,
      numericRating,
      comment ?? null,
    );

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

export async function getReviewsController(req: Request, res: Response) {
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
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

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
    const hallId = Number(req.params.hallId);

    if (Number.isNaN(hallId)) {
      return res.status(400).json({
        message: "Invalid hall ID",
      });
    }

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

    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

    const { rating, comment } = req.body;

    if (rating === undefined && comment === undefined) {
      return res.status(400).json({
        message: "Rating or comment is required",
      });
    }

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

    let numericRating: number | undefined;

    if (rating !== undefined) {
      numericRating = Number(rating);

      if (
        Number.isNaN(numericRating) ||
        numericRating < 1 ||
        numericRating > 5 ||
        !Number.isInteger(numericRating)
      ) {
        return res.status(400).json({
          message: "Rating must be an integer between 1 and 5",
        });
      }
    }

    const updatedReview = await updateReview(
      id,
      numericRating,
      comment !== undefined ? String(comment) : undefined,
    );

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

    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

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
