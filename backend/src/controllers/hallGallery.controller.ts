import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

import {
  getHallById,
  isHallOwnedByUser,
} from "../services/hall.service";

import { uploadHallImage } from "../services/hallImage.service";

import {
  createHallGalleryImage,
  getHallGalleryImages,
  setHallGalleryCover,
} from "../services/hallGallery.service";

import { isValidGalleryImage } from "../services/hallGalleryValidation.service";

async function cleanupGalleryFiles(
  storagePaths: string[],
): Promise<void> {
  if (storagePaths.length === 0) return;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Gallery cleanup: Supabase is not configured");
    return;
  }

  try {
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await supabase.storage
      .from("hall-images")
      .remove(storagePaths);

    if (error) {
      console.error("Gallery cleanup failed:", error);
    }
  } catch (error) {
    console.error("Gallery cleanup error:", error);
  }
}

export async function uploadHallGalleryController(
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

    const files = req.files;

    if (!Array.isArray(files) ||
        files.length === 0 ||
        files.length > 10) {
      res.status(400).json({
        message: "Upload between 1 and 10 images",
      });
      return;
    }

    if (!files.every(isValidGalleryImage)) {
      res.status(400).json({
        message: "Invalid image file content",
      });
      return;
    }

    const uploadedPaths: string[] = [];
    const createdImages = [];

    try {
      for (const file of files) {
        const uploaded = await uploadHallImage(
          hallId,
          file,
        );

        uploadedPaths.push(uploaded.storagePath);

        const image = await createHallGalleryImage(
          hallId,
          uploaded.imageUrl,
          uploaded.storagePath,
        );

        createdImages.push(image);
      }
    } catch (error) {
      // Do not delete files already linked to database
      // records. Reconciliation is needed if partial
      // persistence occurs.
      const unlinkedPaths = uploadedPaths.slice(
        createdImages.length,
      );

      await cleanupGalleryFiles(unlinkedPaths);

      if (createdImages.length > 0) {
        console.error("Partial gallery upload failure:", error);

        res.status(207).json({
          message: "Some images were uploaded successfully",
          hallId,
          uploadedCount: createdImages.length,
          images: createdImages,
        });
        return;
      }

      throw error;
    }

    res.status(201).json({
      message: "Gallery images uploaded successfully",
      hallId,
      images: createdImages,
    });
  } catch (error) {
    console.error("Hall gallery upload error:", error);

    res.status(500).json({
      message: "Failed to upload hall gallery images",
    });
  }
}

export async function getHallGalleryController(
  req: Request,
  res: Response,
): Promise<void> {
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

    const images = await getHallGalleryImages(hallId);

    const publicImages = images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      isCover: image.isCover,
      createdAt: image.createdAt,
    }));

    res.status(200).json({
      hallId,
      count: publicImages.length,
      images: publicImages,
    });
  } catch (error) {
    console.error("Get hall gallery error:", error);

    res.status(500).json({
      message: "Failed to fetch hall gallery",
    });
  }
}

export async function setHallGalleryCoverController(
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
  const imageId = Number(req.params.imageId);

  if (
    !Number.isSafeInteger(hallId) ||
    hallId <= 0 ||
    !Number.isSafeInteger(imageId) ||
    imageId <= 0
  ) {
    res.status(400).json({ message: "Invalid hall or image ID" });
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

    const result = await setHallGalleryCover(hallId, imageId);

    res.status(200).json({
      message: "Hall cover image updated successfully",
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "HALL_NOT_FOUND") {
        res.status(404).json({ message: "Hall not found" });
        return;
      }

      if (error.message === "GALLERY_IMAGE_NOT_FOUND") {
        res.status(404).json({
          message: "Gallery image not found for this hall",
        });
        return;
      }
    }

    console.error("Set hall gallery cover error:", error);

    res.status(500).json({
      message: "Failed to update hall cover image",
    });
  }
}