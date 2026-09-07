"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BookingSuccessContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("bookingId");
  const hallName = searchParams.get("hall");
  const bookingDate = searchParams.get("date");

  const formattedBookingDate = bookingDate
    ? new Date(bookingDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

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

          <Link
            href="/halls"
            className="text-sm font-medium text-zinc-700 hover:text-indigo-600"
          >
            Browse Halls
          </Link>
        </div>
      </header>

      {/* Success */}
      <section className="flex min-h-[calc(100vh-89px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm md:p-12">
            {/* Success Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <span className="text-4xl text-green-600">✓</span>
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-wide text-green-600">
              BOOKING CONFIRMED
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Your hall booking was created!
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-zinc-600">
              Your booking request has been successfully submitted. Please keep
              your booking ID for future reference.
            </p>

            {/* Booking Details */}
            <div className="mt-8 rounded-xl bg-zinc-50 p-6 text-left">
              <h3 className="text-lg font-bold">Booking Details</h3>

              <div className="mt-5 space-y-4">
                {/* Booking ID */}
                <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
                  <span className="text-sm text-zinc-500">Booking ID</span>

                  <span className="font-semibold">#{bookingId || "N/A"}</span>
                </div>

                {/* Hall */}
                <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
                  <span className="text-sm text-zinc-500">Hall</span>

                  <span className="text-right font-semibold">
                    {hallName || "N/A"}
                  </span>
                </div>

                {/* Booking Date */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-500">Booking Date</span>

                  <span className="font-semibold">{formattedBookingDate}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5 text-left">
              <p className="font-semibold text-indigo-900">
                Booking Status: Pending
              </p>

              <p className="mt-2 text-sm leading-6 text-indigo-800">
                Your booking request has been submitted to the hall owner. The
                owner can review and approve or reject the booking request.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {/* Browse More Halls */}
              <Link
                href="/halls"
                className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                Browse More Halls
              </Link>

              {/* My Bookings */}
              <Link
                href="/my-bookings"
                className="rounded-lg border border-zinc-300 px-6 py-3 font-semibold text-zinc-800 transition hover:bg-zinc-50"
              >
                My Bookings
              </Link>

              {/* Go Home */}
              <Link
                href="/"
                className="rounded-lg border border-zinc-300 px-6 py-3 font-semibold text-zinc-800 transition hover:bg-zinc-50"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-zinc-50">
          <p className="text-zinc-500">Loading booking confirmation...</p>
        </main>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
