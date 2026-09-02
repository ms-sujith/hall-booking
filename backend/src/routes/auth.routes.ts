import { Router } from "express";

import { login } from "../controllers/auth.controller";
import { loginRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// ====================
// Login
// POST /auth/login
// ====================

router.post("/login", loginRateLimiter, login);
export default router;
