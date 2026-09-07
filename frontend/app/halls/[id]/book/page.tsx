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
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BookHallPage() {
  const params = useParams();
  const id = params.id;

  const [hall, setHall] = useState<Hall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [guests, setGuests] = useState("");

  useEffect(() => {
    const fetchHall = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/halls`);

        if (!response.ok) {
          throw new Error("Failed to fetch hall");
        }

        const data = await response.json();

        const halls = Array.isArray(data) ? data : data.halls || [];

        const foundHall = halls.find(
          (item: Hall) => String(item.id) === String(id),
        );

        if (!foundHall) {
          setError("Hall not found.");
          return;
        }

        setHall(foundHall);
      } catch (err) {
        console.error(err);
        setError("Unable to load hall details.");
      } finally {
        setLoading(false);
      }
    };

    fetchHall();
  }, [id]);

  const handleBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hall) {
      setError("Hall information is not available.");
      return;
    }
    try {
      setError("");
      setLoading(true);

      const token = localStorage.getItem("hallbook_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hallId: Number(hall.id),
          bookingDate: `${bookingDate}T00:00:00Z`,
          startTime,
          endTime,
          guests: Number(guests),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create booking");
      }

      window.location.href = `/booking-success?bookingId=${encodeURIComponent(
        data.id,
      )}&hall=${encodeURIComponent(hall.name)}&date=${encodeURIComponent(
        bookingDate,
      )}`;
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create booking. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="h-10 w-64 animate-pulse rounded bg-zinc-100" />
          <div className="mt-8 h-96 animate-pulse rounded-2xl bg-zinc-100" />
        </div>
      </main>
    );
  }

  if (error || !hall) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h1 className="text-3xl font-bold">Unable to book this hall</h1>

          <p className="mt-3 text-zinc-600">{error || "Hall not found."}</p>

          <a
            href="/halls"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Back to Halls
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold">
              Hall<span className="text-indigo-600">Book</span>
            </h1>

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

      {/* Booking Section */}
      <section className="bg-zinc-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <a
            href={`/halls/${hall.id}`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Back to hall
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Hall Summary */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-indigo-600">
                BOOKING
              </p>

              <h2 className="mt-3 text-3xl font-bold">{hall.name}</h2>

              <p className="mt-3 text-zinc-600">
                📍 {hall.city}, {hall.address}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-zinc-50 p-5">
                  <p className="text-sm text-zinc-500">Guest Capacity</p>

                  <p className="mt-2 text-xl font-bold">👥 {hall.capacity}</p>
                </div>

                <div className="rounded-xl bg-zinc-50 p-5">
                  <p className="text-sm text-zinc-500">Price</p>

                  <p className="mt-2 text-xl font-bold text-indigo-600">
                    ₹{Number(hall.price).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-xl bg-indigo-50 p-5">
                <p className="text-sm font-medium text-indigo-900">
                  Booking Information
                </p>

                <p className="mt-2 text-sm leading-6 text-indigo-800">
                  Select your preferred date, time and number of guests to
                  continue with your hall booking.
                </p>
              </div>
            </div>

            {/* Booking Form */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-bold">Booking Details</h3>

              <p className="mt-2 text-sm text-zinc-500">
                Enter the details for your event.
              </p>

              <form onSubmit={handleBooking} className="mt-8 space-y-6">
                {/* Date */}
                <div>
                  <label
                    htmlFor="bookingDate"
                    className="mb-2 block text-sm font-medium"
                  >
                    Booking Date
                  </label>

                  <input
                    id="bookingDate"
                    type="date"
                    value={bookingDate}
                    onChange={(event) => setBookingDate(event.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label
                    htmlFor="startTime"
                    className="mb-2 block text-sm font-medium"
                  >
                    Start Time
                  </label>

                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label
                    htmlFor="endTime"
                    className="mb-2 block text-sm font-medium"
                  >
                    End Time
                  </label>

                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Guests */}
                <div>
                  <label
                    htmlFor="guests"
                    className="mb-2 block text-sm font-medium"
                  >
                    Number of Guests
                  </label>

                  <input
                    id="guests"
                    type="number"
                    min="1"
                    max={hall.capacity}
                    value={guests}
                    onChange={(event) => setGuests(event.target.value)}
                    placeholder={`Maximum ${hall.capacity} guests`}
                    required
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-700"
                >
                  Continue Booking
                </button>
              </form>
            </div>
          </div>
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
