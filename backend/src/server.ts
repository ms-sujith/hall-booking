import "temporal-polyfill/global";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db";
import userRouter from "./routes/user.routes";
import hallOwnerRoutes from "./routes/hallOwner.routes";
import hallRoutes from "./routes/hall.routes";
import authRoutes from "./routes/auth.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";
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
// Get All Users
// GET /users
// ====================

app.get("/users", async (req, res) => {
  try {
    const users = await db.orm.public.User.all();

    console.log("Users fetched successfully!");

    return res.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});

// ====================
// Get User By ID
// GET /users/:id
// ====================

app.get("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Check whether ID is a valid number
    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    // Get all users from database
    const users = await db.orm.public.User.all();

    // Find requested user
    const user = users.find((user) => user.id === id);

    // User doesn't exist
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.log(`User ${id} fetched successfully!`);

    return res.json(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);

    return res.status(500).json({
      message: "Failed to fetch user",
    });
  }
});

// ====================
// Create User
// POST /users
// ====================

app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const user = await db.orm.public.User.create({
      name,
      email,
    });

    console.log("User created successfully!");

    return res.status(201).json(user);
  } catch (error: any) {
    console.error("Failed to create user:", error);

    if (error?.sqlState === "23505") {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create user",
    });
  }
});

// ====================
// Start Server
// ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
