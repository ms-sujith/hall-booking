import multer from "multer";
import type { Request, Response, NextFunction } from "express";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: MAX_IMAGES,
    fields: 0,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.includes(file.mimetype)) {
      callback(
        new Error("Only JPEG, PNG and WebP images are allowed"),
      );
      return;
    }

    callback(null, true);
  },
}).array("images", MAX_IMAGES);

export const hallGalleryUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  upload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          message: "Each image must not exceed 5 MB",
        });
        return;
      }

      res.status(400).json({
        message: error.message,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    next(error);
  });
};