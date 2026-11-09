
import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

import {
  getHallById,
  isHallOwnedByUser,
  updateHallImage,
} from "../services/hall.service";

import { uploadHallImage } from "../services/hallImage.service";

function isValidImage(file: Express.Multer.File): boolean {
  const bytes = file.buffer;

  if (file.mimetype === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (file.mimetype === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      )
    );
  }

  if (file.mimetype === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    );
  }

  return false;
}

export async function uploadHallImageController(
  req: Request,
  res: Response,
): Promise<void> {
  const user = (req as any).user;

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const hallId = Number(req.params.id);

  if (!Number.isSafeInteger(hallId) || hallId <= 0) {
    res.status(400).json({ message: "Invalid hall ID" });
    return;
  }

  try {
    const hall = await getHallById(hallId);

    if (!hall) {
      res.status(404).json({ message: "Hall not found" });
      return;
    }

    if (user.role === "OWNER") {
      const ownsHall = await isHallOwnedByUser(
        hallId,
        user.userId,
      );

      if (!ownsHall) {
        res.status(403).json({
          message: "You cannot modify another owner's hall",
        });
        return;
      }
    }

    const file = req.file;

    if (!file) {
      res.status(400).json({
        message: "Image is required (field name: image)",
      });
      return;
    }

    if (!isValidImage(file)) {
      res.status(400).json({
        message: "Invalid image file content",
      });
      return;
    }

    const { imageUrl, storagePath } =
      await uploadHallImage(hallId, file);

    try {
      await updateHallImage(hallId, imageUrl);
    } catch (databaseError) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        try {
          const supabase = createClient(
            supabaseUrl,
            supabaseKey,
          );

          await supabase.storage
            .from("hall-images")
            .remove([storagePath]);
        } catch (cleanupError) {
          console.error(
            "Failed to clean up uploaded hall image:",
            cleanupError,
          );
        }
      }

      throw databaseError;
    }

    res.status(200).json({
      message: "Hall image uploaded successfully",
      hallId,
      imageUrl,
    });
  } catch (error) {
    console.error("Hall image upload error:", error);

    res.status(500).json({
      message: "Failed to upload hall image",
    });
  }
}
