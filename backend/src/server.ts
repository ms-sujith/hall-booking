import "temporal-polyfill/global";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/user.routes";
import hallOwnerRoutes from "./routes/hallOwner.routes";
import hallRoutes from "./routes/hall.routes";
import authRoutes from "./routes/auth.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";
import reviewRoutes from "./routes/review.routes";

dotenv.config();

const app = express();

// ====================
// Middleware
// ====================

app.use(cors());
app.use(express.json());

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

app.get("/", (req, res) => {
  res.json({
    message: "Hall Booking Backend is running",
  });
});

// ====================
// Health Check
// GET /health
// ====================

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
  });
});

// ====================
// Start Server
// ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
