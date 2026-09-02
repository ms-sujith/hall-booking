import "temporal-polyfill/global";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import userRouter from "./routes/user.routes";
import hallOwnerRoutes from "./routes/hallOwner.routes";
import hallRoutes from "./routes/hall.routes";
import authRoutes from "./routes/auth.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";
import reviewRoutes from "./routes/review.routes";

import { errorHandler } from "./middleware/error.middleware";

dotenv.config();

const app = express();

app.use(helmet());

// ====================
// Middleware
// ====================

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);

app.use(express.json({ limit: "100kb" }));

app.use("/users", userRouter);
app.use("/hall-owners", hallOwnerRoutes);
app.use("/halls", hallRoutes);
app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payments", paymentRoutes);
app.use("/reviews", reviewRoutes);

// ====================
// Root API
// GET /
// ====================

app.get("/", (_req, res) => {
  res.json({
    message: "Hall Booking Backend is running",
  });
});

// ====================
// Health Check
// GET /health
// ====================

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ====================
// Global 404 handler
// ====================

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ====================
// Global error handler
// ====================

app.use(errorHandler);

export default app;
