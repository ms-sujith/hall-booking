"use client";

import { useEffect, useState } from "react";

export type HallGalleryImage = {
  id: number;
  imageUrl: string;
  isCover?: boolean;
};

type HallGalleryProps = {
  hallName: string;
  images: HallGalleryImage[];
  fallbackImageUrl?: string | null;
};

export default function HallGallery({
  hallName,
  images,
  fallbackImageUrl,
}: HallGalleryProps) {
  const validImages = images.filter(
    (image) => typeof image.imageUrl === "string" && image.imageUrl.length > 0,
  );

  const galleryImages =
    validImages.length > 0
      ? validImages
      : fallbackImageUrl
        ? [{ id: -1, imageUrl: fallbackImageUrl, isCover: true }]
        : [];

  const coverIndex = Math.max(
    0,
    galleryImages.findIndex((image) => image.isCover),
  );

  const [activeIndex, setActiveIndex] = useState(coverIndex);

  useEffect(() => {
    setActiveIndex(coverIndex);
  }, [coverIndex, images]);

  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];

  function previousImage() {
    setActiveIndex((index) =>
      (index - 1 + galleryImages.length) % galleryImages.length,
    );
  }

  function nextImage() {
    setActiveIndex((index) => (index + 1) % galleryImages.length);
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-indigo-50 to-zinc-100">
        <div className="flex h-[450px] items-center justify-center">
          {activeImage ? (
            <img
              src={activeImage.imageUrl}
              alt={`${hallName} - image ${activeIndex + 1}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="text-6xl" aria-hidden="true">
                🏛️
              </div>
              <p className="mt-4 text-zinc-500">
                No hall images available
              </p>
            </div>
          )}
        </div>

        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={previousImage}
              aria-label="Previous hall image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-4 py-2 font-semibold text-zinc-900 shadow hover:bg-white"
            >
              &lt;
            </button>

            <button
              type="button"
              onClick={nextImage}
              aria-label="Next hall image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-4 py-2 font-semibold text-zinc-900 shadow hover:bg-white"
            >
              &gt;
            </button>

            <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
              {activeIndex + 1} / {galleryImages.length}
            </span>
          </>
        )}
      </div>

      {galleryImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {galleryImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View hall image ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`h-20 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                index === activeIndex
                  ? "border-indigo-600"
                  : "border-transparent"
              }`}
            >
              <img
                src={image.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
