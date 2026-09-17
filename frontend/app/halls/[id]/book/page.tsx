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

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");

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

  const resetAvailability = () => {
    setAvailabilityChecked(false);
    setIsAvailable(null);
    setAvailabilityMessage("");
    setBookingError("");
  };

  const handleDateChange = (value: string) => {
    setBookingDate(value);
    resetAvailability();
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    resetAvailability();
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    resetAvailability();
  };

  const handleCheckAvailability = async () => {
    if (!hall) {
      setAvailabilityMessage("Hall information is not available.");
      setIsAvailable(false);
      setAvailabilityChecked(true);
      return;
    }

    setBookingError("");
    setAvailabilityMessage("");

    if (!bookingDate) {
      setAvailabilityMessage("Please select a booking date.");
      setIsAvailable(false);
      setAvailabilityChecked(true);
      return;
    }

    if (!startTime) {
      setAvailabilityMessage("Please select a start time.");
      setIsAvailable(false);
      setAvailabilityChecked(true);
      return;
    }

    if (!endTime) {
      setAvailabilityMessage("Please select an end time.");
      setIsAvailable(false);
      setAvailabilityChecked(true);
      return;
    }

    if (startTime >= endTime) {
      setAvailabilityMessage("End time must be later than start time.");
      setIsAvailable(false);
      setAvailabilityChecked(true);
      return;
    }

    try {
      setCheckingAvailability(true);
      setAvailabilityChecked(false);
      setIsAvailable(null);

      const query = new URLSearchParams({
        hallId: String(hall.id),
        bookingDate: `${bookingDate}T00:00:00Z`,
        startTime,
        endTime,
      });

      const response = await fetch(
        `${API_URL}/bookings/availability?${query.toString()}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to check hall availability.");
      }

      setAvailabilityChecked(true);
      setIsAvailable(Boolean(data.available));
      setAvailabilityMessage(
        data.message ||
          (data.available
            ? "Booking slot is available."
            : "Booking slot is unavailable."),
      );
    } catch (err) {
      console.error(err);

      setAvailabilityChecked(true);
      setIsAvailable(false);
      setAvailabilityMessage(
        err instanceof Error
          ? err.message
          : "Unable to check availability. Please try again.",
      );
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBooking = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!hall) {
      setBookingError("Hall information is not available.");
      return;
    }

    setBookingError("");

    if (!availabilityChecked || !isAvailable) {
      setBookingError(
        "Please check availability and make sure the selected time slot is available.",
      );
      return;
    }

    if (!bookingDate || !startTime || !endTime || !guests) {
      setBookingError("Please fill in all booking details.");
      return;
    }

    if (startTime >= endTime) {
      setBookingError("End time must be later than start time.");
      return;
    }

    const guestCount = Number(guests);

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > hall.capacity
    ) {
      setBookingError(
        `Number of guests must be between 1 and ${hall.capacity}.`,
      );
      return;
    }

    try {
      setSubmittingBooking(true);

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
          guests: guestCount,
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

      setBookingError(
        err instanceof Error
          ? err.message
          : "Unable to create booking. Please try again.",
      );

      // The booking may have failed because the slot was taken
      // after the availability check.
      setAvailabilityChecked(false);
      setIsAvailable(null);
      setAvailabilityMessage("");
    } finally {
      setSubmittingBooking(false);
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
                    onChange={(event) => handleDateChange(event.target.value)}
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
                    onChange={(event) =>
                      handleStartTimeChange(event.target.value)
                    }
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
                    onChange={(event) =>
                      handleEndTimeChange(event.target.value)
                    }
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
                    onChange={(event) => {
                      setGuests(event.target.value);
                      setBookingError("");
                    }}
                    placeholder={`Maximum ${hall.capacity} guests`}
                    required
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Availability Message */}
                {availabilityMessage && (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      isAvailable
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-red-200 bg-red-50 text-red-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-semibold">
                        {isAvailable ? "✓ Available" : "Not Available"}
                      </span>

                      <span>{availabilityMessage}</span>
                    </div>
                  </div>
                )}

                {/* Booking Error */}
                {bookingError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {bookingError}
                  </div>
                )}

                {/* Check Availability */}
                <button
                  type="button"
                  onClick={handleCheckAvailability}
                  disabled={checkingAvailability}
                  className="w-full rounded-lg border border-indigo-600 bg-white px-5 py-3.5 font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkingAvailability
                    ? "Checking Availability..."
                    : "Check Availability"}
                </button>

                {/* Continue Booking */}
                <button
                  type="submit"
                  disabled={
                    submittingBooking ||
                    checkingAvailability ||
                    !availabilityChecked ||
                    !isAvailable
                  }
                  className="w-full rounded-lg bg-indigo-600 px-5 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingBooking
                    ? "Creating Booking..."
                    : "Continue Booking"}
                </button>

                {!availabilityChecked && (
                  <p className="text-center text-xs text-zinc-500">
                    Please check availability before continuing with the
                    booking.
                  </p>
                )}
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
