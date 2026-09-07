"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://hall-booking-4ix8.onrender.com";

type Hall = {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  capacity?: number;
  price?: number;
  imageUrl?: string;
  amenities?: string[] | string;
};

type Booking = {
  id: number;
  hallId: number;
  bookingDate: string;
  startTime: string;
  endTime?: string;
  guests: number;
  totalAmount?: number;
  status: string;
  createdAt?: string;
};

export default function OwnerBookingsPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOwnerData();
  }, []);

  async function loadOwnerData() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("hallbook_token");
      const storedUser = localStorage.getItem("hallbook_user");

      if (!token || !storedUser) {
        setError("Please login as an owner first.");
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);

      if (user.role !== "OWNER") {
        setError("Access denied. This page is only for hall owners.");
        setLoading(false);
        return;
      }

      // Get all halls belonging to this owner
      const hallsResponse = await fetch(
        `${API_URL}/hall-owners/${user.id}/halls`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const hallsData = await hallsResponse.json();

      if (!hallsResponse.ok) {
        throw new Error(hallsData.message || "Failed to load owner's halls");
      }

      const ownerHalls: Hall[] = Array.isArray(hallsData) ? hallsData : [];

      setHalls(ownerHalls);

      // Get bookings for all owner's halls
      const bookingResults = await Promise.all(
        ownerHalls.map(async (hall) => {
          const response = await fetch(`${API_URL}/bookings/hall/${hall.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || `Failed to load bookings for ${hall.name}`,
            );
          }

          return Array.isArray(data) ? data : [];
        }),
      );

      const allBookings = bookingResults.flat();

      // Newest bookings first
      allBookings.sort((a, b) => b.id - a.id);

      setBookings(allBookings);
    } catch (err: any) {
      console.error("Owner dashboard error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(
    bookingId: number,
    status: "CONFIRMED" | "REJECTED",
  ) {
    try {
      setActionLoading(bookingId);

      const token = localStorage.getItem("hallbook_token");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update booking status");
      }

      // Refresh all owner bookings after the action
      await loadOwnerData();
    } catch (err: any) {
      console.error("Booking status update error:", err);
      setError(err.message || "Failed to update booking status");
    } finally {
      setActionLoading(null);
    }
  }

  function getHallName(hallId: number) {
    const hall = halls.find((item) => item.id === hallId);
    return hall?.name || `Hall #${hallId}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatCurrency(amount?: number) {
    if (amount === undefined || amount === null) {
      return "N/A";
    }

    return `₹${Number(amount).toLocaleString("en-IN")}`;
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-700";

      case "REJECTED":
        return "bg-red-100 text-red-700";

      case "CANCELLED":
        return "bg-zinc-100 text-zinc-600";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <Header />

      {/* Main */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Owner Dashboard
          </p>

          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Hall Bookings</h2>

          <p className="mt-3 max-w-2xl text-zinc-600">
            Manage booking requests for your halls and confirm or reject
            customer bookings.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
            <p className="text-zinc-500">Loading your halls and bookings...</p>
          </div>
        ) : (
          <>
            {/* Hall Summary */}
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-zinc-500">Your Halls</p>

                <p className="mt-2 text-3xl font-bold">{halls.length}</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-zinc-500">Total Bookings</p>

                <p className="mt-2 text-3xl font-bold">{bookings.length}</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-zinc-500">Pending Requests</p>

                <p className="mt-2 text-3xl font-bold">
                  {
                    bookings.filter((booking) => booking.status === "PENDING")
                      .length
                  }
                </p>
              </div>
            </div>

            {/* Halls */}
            {halls.length > 0 && (
              <section className="mt-10">
                <h3 className="text-2xl font-bold">Your Halls</h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  {halls.map((hall) => (
                    <div
                      key={hall.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-xl font-bold">{hall.name}</h4>

                          <p className="mt-1 text-sm text-zinc-500">
                            {hall.city || "Location not available"}
                            {hall.address ? `, ${hall.address}` : ""}
                          </p>
                        </div>

                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          Hall #{hall.id}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                        <div className="rounded-lg bg-zinc-50 p-3">
                          <p className="text-zinc-500">Capacity</p>
                          <p className="mt-1 font-semibold">
                            {hall.capacity || "N/A"}
                          </p>
                        </div>

                        <div className="rounded-lg bg-zinc-50 p-3">
                          <p className="text-zinc-500">Price</p>
                          <p className="mt-1 font-semibold">
                            {formatCurrency(hall.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bookings */}
            <section className="mt-12">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold">Booking Requests</h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    Review and manage customer bookings.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadOwnerData}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Refresh
                </button>
              </div>

              {bookings.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
                  <p className="text-lg font-semibold">No bookings yet</p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Customer booking requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col justify-between gap-5 md:flex-row">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-xl font-bold">
                              Booking #{booking.id}
                            </h4>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                booking.status,
                              )}`}
                            >
                              {booking.status}
                            </span>
                          </div>

                          <p className="mt-3 text-lg font-semibold">
                            {getHallName(booking.hallId)}
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-sm text-zinc-500">Total Amount</p>

                          <p className="mt-1 text-xl font-bold">
                            {formatCurrency(booking.totalAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 border-t border-zinc-200 pt-5 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">
                            Date
                          </p>

                          <p className="mt-1 font-semibold">
                            {formatDate(booking.bookingDate)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">
                            Time
                          </p>

                          <p className="mt-1 font-semibold">
                            {booking.startTime}
                            {booking.endTime ? ` - ${booking.endTime}` : ""}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">
                            Guests
                          </p>

                          <p className="mt-1 font-semibold">{booking.guests}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      {booking.status === "PENDING" && (
                        <div className="mt-6 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row">
                          <button
                            type="button"
                            disabled={actionLoading === booking.id}
                            onClick={() =>
                              updateBookingStatus(booking.id, "CONFIRMED")
                            }
                            className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionLoading === booking.id
                              ? "Updating..."
                              : "Confirm Booking"}
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading === booking.id}
                            onClick={() =>
                              updateBookingStatus(booking.id, "REJECTED")
                            }
                            className="rounded-lg border border-red-300 px-5 py-3 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reject Booking
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
