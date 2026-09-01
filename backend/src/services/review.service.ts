import { db } from "../db";

// ====================
// Create Review
// ====================

export async function createReview(
  userId: number,
  hallId: number,
  rating: number,
  comment: string | null,
) {
  const review = await db.orm.public.Review.create({
    userId,
    hallId,
    rating,
    comment,
  });

  return review;
}

// ====================
// Get All Reviews
// ====================

export async function getReviews() {
  const reviews = await db.orm.public.Review.all();

  return reviews;
}

// ====================
// Get Review By ID
// ====================

export async function getReviewById(id: number) {
  const reviews = await db.orm.public.Review.all();

  const review = reviews.find((review) => review.id === id);

  return review;
}

// ====================
// Get Reviews By User ID
// ====================

export async function getReviewsByUserId(userId: number) {
  const reviews = await db.orm.public.Review.all();

  const userReviews = reviews.filter((review) => review.userId === userId);

  return userReviews;
}

// ====================
// Get Reviews By Hall ID
// ====================

export async function getReviewsByHallId(hallId: number) {
  const reviews = await db.orm.public.Review.all();

  const hallReviews = reviews.filter((review) => review.hallId === hallId);

  return hallReviews;
}

// ====================
// Update Review
// ====================

export async function updateReview(
  id: number,
  rating?: number,
  comment?: string,
) {
  const updateData: {
    rating?: number;
    comment?: string;
  } = {};

  if (rating !== undefined) {
    updateData.rating = rating;
  }

  if (comment !== undefined) {
    updateData.comment = comment;
  }

  const updatedReview = await db.orm.public.Review.where({
    id,
  }).update(updateData);

  return updatedReview;
}

// ====================
// Delete Review
// ====================

export async function deleteReview(id: number) {
  const deletedReview = await db.orm.public.Review.where({
    id,
  }).delete();

  return deletedReview;
}
