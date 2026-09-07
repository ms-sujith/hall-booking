"use client";

import { useEffect, useState } from "react";

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

export default function HallsPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check whether the customer is logged in
  useEffect(() => {
    const token = localStorage.getItem("hallbook_token");
    setIsLoggedIn(!!token);
  }, []);

  // Fetch halls
  useEffect(() => {
    const fetchHalls = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/halls`);

        if (!response.ok) {
          throw new Error("Failed to fetch halls");
        }

        const data = await response.json();

        setHalls(Array.isArray(data) ? data : data.halls || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load halls. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHalls();
  }, []);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <div>
            <a href="/" className="text-2xl font-bold">
              Hall<span className="text-indigo-600">Book</span>
            </a>

            <p className="text-sm text-zinc-500">Find. Book. Celebrate.</p>
          </div>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <a href="/" className="text-sm font-medium hover:text-indigo-600">
              Home
            </a>

            <a href="/halls" className="text-sm font-medium text-indigo-600">
              Halls
            </a>

            {isLoggedIn && (
              <a
                href="/my-bookings"
                className="text-sm font-medium hover:text-indigo-600"
              >
                My Bookings
              </a>
            )}

            <a href="#" className="text-sm font-medium hover:text-indigo-600">
              About
            </a>
          </nav>

          {/* Authentication buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <a
                  href="/my-bookings"
                  className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50"
                >
                  My Bookings
                </a>

                <button
                  onClick={() => {
                    localStorage.removeItem("hallbook_token");
                    window.location.href = "/login";
                  }}
                  className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page Heading */}
      <section className="bg-zinc-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-indigo-600">
            HALLS
          </p>

          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Find your perfect hall
          </h2>

          <p className="mt-4 max-w-2xl text-lg text-zinc-600">
            Explore marriage halls, function halls and convention centres
            available on HallBook.
          </p>
        </div>
      </section>

      {/* Halls */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-7xl">
          {/* Loading */}
          {loading && (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                >
                  <div className="h-56 animate-pulse bg-zinc-100" />

                  <div className="space-y-4 p-6">
                    <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-100" />

                    <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />

                    <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100" />

                    <div className="h-11 animate-pulse rounded-lg bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="font-medium text-red-700">{error}</p>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No halls */}
          {!loading && !error && halls.length === 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-12 text-center">
              <div className="text-5xl">🏛️</div>

              <h3 className="mt-4 text-2xl font-bold">No halls available</h3>

              <p className="mt-2 text-zinc-600">
                There are currently no halls listed on HallBook.
              </p>
            </div>
          )}

          {/* Halls available */}
          {!loading && !error && halls.length > 0 && (
            <>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Available halls</h3>

                  <p className="mt-1 text-zinc-500">
                    {halls.length} hall
                    {halls.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              </div>

              <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {halls.map((hall) => (
                  <article
                    key={hall.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Image */}
                    <div className="flex h-56 items-center justify-center bg-gradient-to-br from-indigo-50 to-zinc-100">
                      {hall.imageUrl ? (
                        <img
                          src={hall.imageUrl}
                          alt={hall.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="text-6xl">🏛️</div>

                          <p className="mt-2 text-sm text-zinc-400">
                            Hall image
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold">{hall.name}</h3>

                      <p className="mt-3 text-sm text-zinc-500">
                        📍 {hall.city}, {hall.address}
                      </p>

                      <div className="mt-5 flex items-center justify-between">
                        <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium">
                          👥 {hall.capacity} Guests
                        </span>

                        <span className="font-bold text-indigo-600">
                          ₹{Number(hall.price).toLocaleString("en-IN")}
                          /day
                        </span>
                      </div>

                      <button
                        className="mt-6 w-full rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white transition hover:bg-indigo-600"
                        onClick={() => {
                          window.location.href = `/halls/${hall.id}`;
                        }}
                      >
                        View Hall
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-6 py-6 text-sm text-zinc-500 md:flex-row">
          <p>© 2026 HallBook. All rights reserved.</p>

          <p>Built with Next.js, Tailwind CSS, Node.js & PostgreSQL</p>
        </div>
      </footer>
    </main>
  );
}
