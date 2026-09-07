"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Booking = {
  id: number;
  userId: number;
  hallId: number;
  bookingDate: string;
  startTime: string;
  endTime?: string | null;
  guests: number;
  status: string;
  totalAmount: number | string;
  createdAt?: string;
  updatedAt?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BookingDetailsPage() {
  const params = useParams();

  const bookingId = params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("hallbook_token");

        if (!token) {
          setError("Please login to view this booking.");
          return;
        }

        const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session has expired. Please login again.");
          }

          if (response.status === 403) {
            throw new Error("You do not have permission to view this booking.");
          }

          if (response.status === 404) {
            throw new Error("Booking not found.");
          }

          throw new Error("Failed to fetch booking.");
        }

        const data = await response.json();

        setBooking(data);
      } catch (err) {
        console.error("Failed to fetch booking:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load booking details.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const formattedBookingDate = booking?.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const formattedCreatedDate = booking?.createdAt
    ? new Date(booking.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const status = booking?.status || "";

  const handleCancelBooking = async () => {
    if (!booking) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setCancelError("");

      const token = localStorage.getItem("hallbook_token");

      if (!token) {
        setCancelError("Please login to cancel this booking.");
        return;
      }

      const response = await fetch(`${API_URL}/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "CANCELLED",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.message || "Failed to cancel booking.");
      }

      const updatedBooking = await response.json();

      setBooking(updatedBooking);
    } catch (err) {
      console.error("Failed to cancel booking:", err);

      setCancelError(
        err instanceof Error ? err.message : "Unable to cancel booking.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const statusClass =
    status === "CONFIRMED"
      ? "bg-green-100 text-green-700"
      : status === "REJECTED"
        ? "bg-red-100 text-red-700"
        : status === "CANCELLED"
          ? "bg-zinc-200 text-zinc-700"
          : "bg-indigo-100 text-indigo-700";

  const canCancel =
    booking?.status === "PENDING" || booking?.status === "CONFIRMED";

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="block">
            <h1 className="text-2xl font-bold">
              Hall<span className="text-indigo-600">Book</span>
            </h1>

            <p className="text-sm text-zinc-500">Find. Book. Celebrate.</p>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium hover:text-indigo-600"
            >
              Home
            </Link>

            <Link
              href="/halls"
              className="text-sm font-medium hover:text-indigo-600"
            >
              Halls
            </Link>

            <Link
              href="/my-bookings"
              className="text-sm font-medium text-indigo-600"
            >
              My Bookings
            </Link>
          </nav>

          <Link
            href="/halls"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Browse Halls
          </Link>
        </div>
      </header>

      {/* Page */}
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          {/* Back */}
          <Link
            href="/my-bookings"
            className="inline-flex items-center text-sm font-medium text-zinc-600 hover:text-indigo-600"
          >
            ← Back to My Bookings
          </Link>

          {/* Heading */}
          <div className="mt-8">
            <p className="text-sm font-bold uppercase tracking-wide text-indigo-600">
              BOOKING DETAILS
            </p>

            <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                Booking #{bookingId}
              </h2>

              {booking && (
                <span
                  className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${statusClass}`}
                >
                  {booking.status}
                </span>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="animate-pulse p-8">
                <div className="h-7 w-1/3 rounded bg-zinc-100" />

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div className="h-20 rounded-lg bg-zinc-100" />
                  <div className="h-20 rounded-lg bg-zinc-100" />
                  <div className="h-20 rounded-lg bg-zinc-100" />
                  <div className="h-20 rounded-lg bg-zinc-100" />
                  <div className="h-20 rounded-lg bg-zinc-100" />
                  <div className="h-20 rounded-lg bg-zinc-100" />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <div className="text-4xl">⚠️</div>

              <h3 className="mt-4 text-xl font-bold text-red-800">
                Unable to load booking
              </h3>

              <p className="mt-2 text-red-700">{error}</p>

              <Link
                href="/my-bookings"
                className="mt-6 inline-block rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition hover:bg-indigo-600"
              >
                Back to My Bookings
              </Link>
            </div>
          )}

          {/* Booking Details */}
          {!loading && !error && booking && (
            <div className="mt-10 space-y-6">
              {/* Main Card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-sm text-zinc-500">Booking ID</p>

                    <h3 className="mt-1 text-2xl font-bold">#{booking.id}</h3>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm text-zinc-500">Booking Status</p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusClass}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {/* Hall ID */}
                  <div className="rounded-xl bg-zinc-50 p-5">
                    <p className="text-sm text-zinc-500">Hall</p>

                    <p className="mt-2 text-lg font-semibold">
                      Hall #{booking.hallId}
                    </p>
                  </div>

                  {/* Booking Date */}
                  <div className="rounded-xl bg-zinc-50 p-5">
                    <p className="text-sm text-zinc-500">Booking Date</p>

                    <p className="mt-2 text-lg font-semibold">
                      {formattedBookingDate}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="rounded-xl bg-zinc-50 p-5">
                    <p className="text-sm text-zinc-500">Time</p>

                    <p className="mt-2 text-lg font-semibold">
                      {booking.startTime}
                      {" - "}
                      {booking.endTime || "Not specified"}
                    </p>
                  </div>

                  {/* Guests */}
                  <div className="rounded-xl bg-zinc-50 p-5">
                    <p className="text-sm text-zinc-500">Guests</p>

                    <p className="mt-2 text-lg font-semibold">
                      {booking.guests}
                    </p>
                  </div>

                  {/* Total Amount */}
                  <div className="rounded-xl bg-zinc-50 p-5">
                    <p className="text-sm text-zinc-500">Total Amount</p>

                    <p className="mt-2 text-lg font-bold text-indigo-600">
                      ₹{Number(booking.totalAmount).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Created Date */}
                  <div className="rounded-xl bg-zinc-50 p-5">
                    <p className="text-sm text-zinc-500">Booking Created</p>

                    <p className="mt-2 text-lg font-semibold">
                      {formattedCreatedDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
                <h3 className="font-bold text-indigo-900">
                  {booking.status === "CONFIRMED"
                    ? "Booking Confirmed"
                    : booking.status === "REJECTED"
                      ? "Booking Rejected"
                      : booking.status === "CANCELLED"
                        ? "Booking Cancelled"
                        : "Booking Pending"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-indigo-800">
                  {booking.status === "CONFIRMED"
                    ? "Your hall booking has been confirmed. Please keep your booking details for future reference."
                    : booking.status === "REJECTED"
                      ? "This booking request has been rejected by the hall owner."
                      : booking.status === "CANCELLED"
                        ? "This booking has been cancelled."
                        : "Your booking request has been submitted to the hall owner. The owner can review and approve or reject the booking request."}
                </p>
              </div>

              {/* Cancellation Error */}
              {cancelError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {cancelError}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/my-bookings"
                  className="rounded-lg bg-indigo-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-indigo-700"
                >
                  ← My Bookings
                </Link>

                {canCancel && (
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    disabled={cancelling}
                    className="rounded-lg bg-red-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelling ? "Cancelling..." : "Cancel Booking"}
                  </button>
                )}

                <Link
                  href="/halls"
                  className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-center font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  Browse More Halls
                </Link>

                <Link
                  href="/"
                  className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-center font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  Go Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-6 py-6 text-sm text-zinc-500 md:flex-row">
          <p>© 2026 HallBook. All rights reserved.</p>

          <p>Built with Next.js, Tailwind CSS, Node.js & PostgreSQL</p>
        </div>
      </footer>
    </main>
  );
}
