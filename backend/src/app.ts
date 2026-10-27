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

// ====================
// Security Middleware
// ====================

app.use(helmet());

// ====================
// CORS Configuration
// ====================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://hall-booking-brown.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as
      // direct server-to-server requests and local API tools.
      if (!origin) {
        callback(null, true);
        return;
      }

      // Allow the explicitly trusted frontend origins.
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // Allow HallBook deployment URLs belonging to this
      // Vercel team, including the current production deployment.
      const isHallBookVercelDeployment =
        /^https:\/\/hall-booking-[a-z0-9-]+-fullstack-sujithms-team\.vercel\.app$/i.test(
          origin,
        );

      if (isHallBookVercelDeployment) {
        callback(null, true);
        return;
      }

      // Reject origins that are not on the allowlist.
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
  }),
);

// ====================
// Request Parsing
// ====================

app.use(express.json({ limit: "100kb" }));

// ====================
// API Routes
// ====================

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
// Global 404 Handler
// ====================

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ====================
// Global Error Handler
// ====================

app.use(errorHandler);

export default app;
