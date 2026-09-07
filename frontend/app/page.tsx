"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";

type Hall = {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  price: number | string;
  imageUrl?: string | null;
  description?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHalls() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/halls`);

        if (!response.ok) {
          throw new Error("Failed to fetch halls");
        }

        const data = await response.json();

        setHalls(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Hall fetch error:", err);
        setError("Unable to load halls. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchHalls();
  }, []);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <Header />

      {/* Hero */}
      <section className="bg-zinc-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
              The easier way to book your perfect hall
            </div>

            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find the perfect
              <span className="text-indigo-600"> event hall </span>
              for your special day.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              Discover marriage halls, function halls and convention centres,
              compare options and book with confidence.
            </p>
          </div>

          {/* Search Box */}
          <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Location
                </label>

                <input
                  type="text"
                  placeholder="Hassan, Sakleshpur..."
                  className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Event Date
                </label>

                <input
                  type="date"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Guests
                </label>

                <select className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-indigo-500">
                  <option>Any capacity</option>
                  <option>Below 200</option>
                  <option>200 - 500</option>
                  <option>500 - 1000</option>
                  <option>1000+</option>
                </select>
              </div>

              <div className="flex items-end">
                <button className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
                  Search Halls
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Halls */}
      <section id="halls" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Featured Halls
            </p>

            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              Popular venues
            </h3>

            <p className="mt-2 text-zinc-600">
              Explore halls available on our platform.
            </p>
          </div>

          <a
            href="/halls"
            className="w-fit rounded-lg border border-zinc-300 px-5 py-3 text-sm font-medium hover:bg-zinc-50"
          >
            View all halls
          </a>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200"
              >
                <div className="h-48 bg-zinc-200" />

                <div className="space-y-4 p-6">
                  <div className="h-6 rounded bg-zinc-200" />
                  <div className="h-4 w-2/3 rounded bg-zinc-200" />
                  <div className="h-4 w-1/2 rounded bg-zinc-200" />
                  <div className="h-10 rounded bg-zinc-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-700">{error}</p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No halls */}
        {!loading && !error && halls.length === 0 && (
          <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-10 text-center">
            <div className="text-5xl">🏛️</div>

            <h4 className="mt-4 text-xl font-semibold">No halls available</h4>

            <p className="mt-2 text-zinc-500">Please check again later.</p>
          </div>
        )}

        {/* Real halls */}
        {!loading && !error && halls.length > 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {halls.slice(0, 6).map((hall) => (
              <article
                key={hall.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Hall image */}
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-zinc-100">
                  {hall.imageUrl ? (
                    <img
                      src={hall.imageUrl}
                      alt={hall.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">🏛️</span>
                  )}
                </div>

                <div className="p-6">
                  <h4 className="text-xl font-semibold">{hall.name}</h4>

                  <p className="mt-2 text-sm text-zinc-500">
                    📍 {hall.city}, {hall.address}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="rounded-full bg-zinc-100 px-3 py-1">
                      👥 {hall.capacity} Guests
                    </span>

                    <span className="font-semibold text-indigo-600">
                      ₹{Number(hall.price).toLocaleString("en-IN")}/day
                    </span>
                  </div>

                  <a
                    href={`/halls/${hall.id}`}
                    className="mt-5 block w-full rounded-lg bg-zinc-900 px-4 py-3 text-center font-medium text-white hover:bg-zinc-800"
                  >
                    View Hall
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section id="about" className="bg-zinc-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Simple Process
            </p>

            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              Book your hall in three steps
            </h3>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">
                🔎
              </div>

              <h4 className="mt-5 text-xl font-semibold">1. Search</h4>

              <p className="mt-3 text-zinc-600">
                Search halls by location, date and guest capacity.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">
                🏛️
              </div>

              <h4 className="mt-5 text-xl font-semibold">2. Compare</h4>

              <p className="mt-3 text-zinc-600">
                Compare halls, prices and facilities before choosing.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl">
                ✅
              </div>

              <h4 className="mt-5 text-xl font-semibold">3. Book</h4>

              <p className="mt-3 text-zinc-600">
                Choose your hall and complete your booking securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© 2026 HallBook. All rights reserved.</p>

          <p>Built with Next.js, Tailwind CSS, Node.js & PostgreSQL</p>
        </div>
      </footer>
    </main>
  );
}
