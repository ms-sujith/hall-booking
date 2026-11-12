import { db } from "../db";

export async function createHallGalleryImage(
  hallId: number,
  imageUrl: string,
  storagePath: string,
) {
  return db.orm.public.HallImage.create({
    hallId,
    imageUrl,
    storagePath,
    isCover: false,
  });
}

export async function getHallGalleryImages(hallId: number) {
  const images = await db.orm.public.HallImage.all();

  return images.filter((image) => image.hallId === hallId);
}

export async function getHallGalleryImageById(
  hallId: number,
  imageId: number,
) {
  const images = await getHallGalleryImages(hallId);

  return images.find((image) => image.id === imageId) ?? null;
}

export async function updateHallGalleryCoverFlag(
  imageId: number,
  isCover: boolean,
) {
  return db.orm.public.HallImage.where({
    id: imageId,
  }).update({
    isCover,
  });
}

export async function setHallGalleryCover(
  hallId: number,
  imageId: number,
) {
  return db.transaction(async (tx) => {
    const lockPlan = db.raw.sql`
      SELECT id
      FROM "public"."hall"
      WHERE id = ${hallId}
      FOR UPDATE
    `
      .returnsRow({ id: "pg/int4@1" })
      .build();

    const lockedHalls = [];

    for await (const row of tx.query(lockPlan)) {
      lockedHalls.push(row);
    }

    if (lockedHalls.length === 0) {
      throw new Error("HALL_NOT_FOUND");
    }

    const hall = await tx.orm.public.Hall
      .where({ id: hallId })
      .first();

    if (!hall) {
      throw new Error("HALL_NOT_FOUND");
    }

    const selectedImage = await tx.orm.public.HallImage
      .where({ id: imageId, hallId })
      .first();

    if (!selectedImage) {
      throw new Error("GALLERY_IMAGE_NOT_FOUND");
    }

    const galleryImages = await tx.orm.public.HallImage
      .where({ hallId })
      .all();

    for (const image of galleryImages) {
      if (image.isCover && image.id !== imageId) {
        await tx.orm.public.HallImage
          .where({ id: image.id, hallId })
          .update({ isCover: false });
      }
    }

    await tx.orm.public.HallImage
      .where({ id: imageId, hallId })
      .update({ isCover: true });

    await tx.orm.public.Hall
      .where({ id: hallId })
      .update({ imageUrl: selectedImage.imageUrl });

    return {
      hallId,
      imageId,
      imageUrl: selectedImage.imageUrl,
      isCover: true,
    };
  });
}