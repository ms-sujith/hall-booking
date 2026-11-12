import type {} from "multer";

export function isValidGalleryImage(
  file: Express.Multer.File,
): boolean {
  const bytes = file.buffer;

  if (!bytes || bytes.length === 0) {
    return false;
  }

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