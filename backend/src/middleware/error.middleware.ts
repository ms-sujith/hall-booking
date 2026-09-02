import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error("Unhandled error:", error);

  // Request body too large
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request body is too large",
    });
  }

  // Invalid JSON body
  if (
    error instanceof SyntaxError &&
    (error as any).status === 400 &&
    "body" in error
  ) {
    return res.status(400).json({
      message: "Invalid JSON request body",
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
}
