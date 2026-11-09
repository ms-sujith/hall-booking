import type {} from "multer";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "hall-images";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadHallImage(
  hallId: number,
  file: Express.Multer.File,
): Promise<{ imageUrl: string; storagePath: string }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase Storage is not configured");
  }

  if (!Number.isInteger(hallId) || hallId <= 0) {
    throw new Error("Invalid hall ID");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image exceeds the 5 MB limit");
  }

  const extension = ALLOWED_TYPES.get(file.mimetype);

  if (!extension) {
    throw new Error("Unsupported image type");
  }

  // These checks supplement server-side upload validation.
  // The controller must verify file content and ownership.
  const storagePath = `halls/${hallId}/${randomUUID()}.${extension}`;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

  return {
    imageUrl: data.publicUrl,
    storagePath,
  };
}
