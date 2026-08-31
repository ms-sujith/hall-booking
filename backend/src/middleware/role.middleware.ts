import type { Request, Response, NextFunction } from "express";

type UserRole = "CUSTOMER" | "OWNER" | "ADMIN";

// ====================
// Role Authorization
// ====================

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
}
