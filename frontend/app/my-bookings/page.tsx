"use client";

import { useEffect, useState } from "react";

type Hall = {
  id: number;
  name: string;
  city: string;
  address: string;
};

type Booking = {
  id: number;
  hallId: number;
  bookingDate: string;
  startTime: string;
  endTime?: string | null;
  guests: number;
  status: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("hallbook_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const [bookingsResponse, hallsResponse] = await Promise.all([
          fetch(`${API_URL}/bookings/my`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/halls`),
        ]);

        if (bookingsResponse.status === 401) {
          localStorage.removeItem("hallbook_token");
          window.location.href = "/login";
          return;
        }

        if (!bookingsResponse.ok) {
          throw new Error("Failed to fetch bookings");
        }

        if (!hallsResponse.ok) {
          throw new Error("Failed to fetch halls");
        }

        const bookingsData = await bookingsResponse.json();
        const hallsData = await hallsResponse.json();

        setBookings(
          Array.isArray(bookingsData)
            ? bookingsData
            : bookingsData.bookings || [],
        );

        setHalls(Array.isArray(hallsData) ? hallsData : hallsData.halls || []);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your bookings. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getHall = (hallId: number) => {
    return halls.find((hall) => hall.id === hallId);
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
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

            <a
              href="/halls"
              className="text-sm font-medium hover:text-indigo-600"
            >
              Halls
            </a>

            <a
              href="/my-bookings"
              className="text-sm font-medium text-indigo-600"
            >
              My Bookings
            </a>
          </nav>

          <a
            href="/halls"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Browse Halls
          </a>
        </div>
      </header>

      {/* Page Heading */}
      <section className="bg-zinc-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-indigo-600">
            BOOKINGS
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            My Bookings
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-zinc-600">
            View and track all your hall booking requests in one place.
          </p>
        </div>
      </section>

      {/* Bookings */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-7xl">
          {loading && (
            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-zinc-200 p-6"
                >
                  <div className="h-6 w-1/3 rounded bg-zinc-100" />
                  <div className="mt-4 h-4 w-1/2 rounded bg-zinc-100" />
                  <div className="mt-3 h-4 w-1/4 rounded bg-zinc-100" />
                  <div className="mt-6 h-10 w-32 rounded bg-zinc-100" />
                </div>
              ))}
            </div>
          )}

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

          {!loading && !error && bookings.length === 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-12 text-center">
              <div className="text-5xl">📅</div>

              <h2 className="mt-4 text-2xl font-bold">No bookings yet</h2>

              <p className="mt-2 text-zinc-600">
                You have not made any hall bookings yet.
              </p>

              <a
                href="/halls"
                className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
              >
                Browse Halls
              </a>
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="space-y-6">
              {bookings.map((booking) => {
                const hall = getHall(booking.hallId);

                return (
                  <article
                    key={booking.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row">
                      <div>
                        <p className="text-sm font-medium text-indigo-600">
                          BOOKING #{booking.id}
                        </p>

                        <h2 className="mt-2 text-2xl font-bold">
                          {hall?.name || `Hall #${booking.hallId}`}
                        </h2>

                        {hall && (
                          <p className="mt-2 text-zinc-500">
                            📍 {hall.city}, {hall.address}
                          </p>
                        )}
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                            booking.status === "APPROVED" ||
                            booking.status === "CONFIRMED"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : booking.status === "CANCELLED"
                                  ? "bg-zinc-100 text-zinc-700"
                                  : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 border-t border-zinc-200 pt-6 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-zinc-500">Booking Date</p>

                        <p className="mt-1 font-semibold">
                          {new Date(booking.bookingDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-zinc-500">Time</p>

                        <p className="mt-1 font-semibold">
                          {booking.startTime}
                          {booking.endTime ? ` - ${booking.endTime}` : ""}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-zinc-500">Guests</p>

                        <p className="mt-1 font-semibold">{booking.guests}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <a
                        href={`/my-bookings/${booking.id}`}
                        className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50"
                      >
                        View Booking
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
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
