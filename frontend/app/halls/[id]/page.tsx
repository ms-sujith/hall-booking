"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Hall = {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  price: number | string;
  imageUrl?: string | null;
  description?: string | null;
  amenities?: string[] | string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HallDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [hall, setHall] = useState<Hall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHall = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/halls`);

        if (!response.ok) {
          throw new Error("Failed to fetch halls");
        }

        const data = await response.json();

        const halls: Hall[] = Array.isArray(data) ? data : data.halls || [];

        const selectedHall = halls.find(
          (item) => String(item.id) === String(id),
        );

        if (!selectedHall) {
          setError("Hall not found.");
          return;
        }

        setHall(selectedHall);
      } catch (err) {
        console.error(err);
        setError("Unable to load hall details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHall();
    }
  }, [id]);

  /* =========================
     LOADING STATE
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-zinc-900">
        <header className="border-b border-zinc-200">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <a href="/" className="text-2xl font-bold">
              Hall<span className="text-indigo-600">Book</span>
            </a>

            <p className="text-sm text-zinc-500">Find. Book. Celebrate.</p>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-100" />

          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div className="h-[450px] animate-pulse rounded-2xl bg-zinc-100" />

            <div className="space-y-5">
              <div className="h-5 w-32 animate-pulse rounded bg-zinc-100" />

              <div className="h-12 w-3/4 animate-pulse rounded bg-zinc-100" />

              <div className="h-6 w-1/2 animate-pulse rounded bg-zinc-100" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-24 animate-pulse rounded-xl bg-zinc-100" />
                <div className="h-24 animate-pulse rounded-xl bg-zinc-100" />
              </div>

              <div className="h-28 animate-pulse rounded bg-zinc-100" />

              <div className="h-14 animate-pulse rounded-xl bg-zinc-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */

  if (error || !hall) {
    return (
      <main className="min-h-screen bg-white text-zinc-900">
        <header className="border-b border-zinc-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div>
              <a href="/" className="text-2xl font-bold">
                Hall<span className="text-indigo-600">Book</span>
              </a>

              <p className="text-sm text-zinc-500">Find. Book. Celebrate.</p>
            </div>

            <a
              href="/halls"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50"
            >
              Back to Halls
            </a>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="text-6xl">🏛️</div>

          <h1 className="mt-6 text-3xl font-bold">
            {error || "Hall not found"}
          </h1>

          <p className="mt-3 text-zinc-500">
            The hall you are looking for could not be found.
          </p>

          <a
            href="/halls"
            className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Back to All Halls
          </a>
        </div>
      </main>
    );
  }

  /* =========================
     SAFE AMENITIES HANDLING
  ========================= */

  const amenities: string[] = Array.isArray(hall.amenities)
    ? hall.amenities
    : typeof hall.amenities === "string"
      ? hall.amenities
          .replace(/[\[\]"]/g, "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  /* =========================
     HALL DETAILS PAGE
  ========================= */

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* =========================
          HEADER
      ========================= */}

      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <a href="/" className="text-2xl font-bold">
              Hall<span className="text-indigo-600">Book</span>
            </a>

            <p className="text-sm text-zinc-500">Find. Book. Celebrate.</p>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="/" className="text-sm font-medium hover:text-indigo-600">
              Home
            </a>

            <a href="/halls" className="text-sm font-medium text-indigo-600">
              Halls
            </a>

            <a href="#" className="text-sm font-medium hover:text-indigo-600">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50"
            >
              Login
            </a>

            <a
              href="#"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Register
            </a>
          </div>
        </div>
      </header>

      {/* =========================
          HALL DETAILS
      ========================= */}

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          {/* Back */}

          <a
            href="/halls"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            ← Back to all halls
          </a>

          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            {/* =========================
                HALL IMAGE
            ========================= */}

            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-indigo-50 to-zinc-100">
              <div className="flex h-[450px] items-center justify-center">
                {hall.imageUrl ? (
                  <img
                    src={hall.imageUrl}
                    alt={hall.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-8xl">🏛️</div>

                    <p className="mt-4 text-zinc-400">Hall image</p>
                  </div>
                )}
              </div>
            </div>

            {/* =========================
                HALL INFORMATION
            ========================= */}

            <div className="flex flex-col justify-center">
              <p className="text-sm font-bold uppercase tracking-wide text-indigo-600">
                EVENT HALL
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                {hall.name}
              </h1>

              <p className="mt-5 text-lg text-zinc-600">
                📍 {hall.city}, {hall.address}
              </p>

              {/* =========================
                  CAPACITY + PRICE
              ========================= */}

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-zinc-50 p-5">
                  <p className="text-sm text-zinc-500">Guest Capacity</p>

                  <p className="mt-1 text-xl font-bold">
                    👥 {hall.capacity} Guests
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-50 p-5">
                  <p className="text-sm text-zinc-500">Price</p>

                  <p className="mt-1 text-xl font-bold text-indigo-600">
                    ₹{Number(hall.price).toLocaleString("en-IN")}/day
                  </p>
                </div>
              </div>

              {/* =========================
                  DESCRIPTION
              ========================= */}

              <div className="mt-8">
                <h2 className="text-xl font-bold">About this hall</h2>

                <p className="mt-3 leading-7 text-zinc-600">
                  {hall.description ||
                    "This hall is available for weddings, receptions, family functions, corporate events and other special occasions."}
                </p>
              </div>

              {/* =========================
                  AMENITIES
              ========================= */}

              {amenities.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold">Amenities</h2>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {amenities.map((amenity, index) => (
                      <span
                        key={`${amenity}-${index}`}
                        className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700"
                      >
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* =========================
                  BOOK BUTTON
              ========================= */}

              <a
                href={`/halls/${hall.id}/book`}
                className="block w-full rounded-lg bg-indigo-600 px-5 py-4 text-center text-lg font-semibold text-white transition hover:bg-indigo-700"
              >
                Book This Hall
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-6 py-6 text-sm text-zinc-500 md:flex-row">
          <p>© 2026 HallBook. All rights reserved.</p>

          <p>Built with Next.js, Tailwind CSS, Node.js & PostgreSQL</p>
        </div>
      </footer>
    </main>
  );
}
