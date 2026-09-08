"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";

type User = {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "OWNER" | "ADMIN";
};

type HallUser = {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "OWNER" | "ADMIN";
};

type Hall = {
  id: number;
  ownerId: number;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  capacity: number;
  price: string | number;
  imageUrl?: string | null;
  amenities?: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: number | null;

  owner?: HallUser | null;
  creator?: HallUser | null;
};

type Booking = {
  id: number;
  hallId: number;
  userId: number;
  bookingDate: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REJECTED";
  createdAt?: string;
  hall?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingBookingId, setUpdatingBookingId] = useState<number | null>(
    null,
  );

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("hallbook_token");

      if (!token) {
        setError("Admin authentication token not found.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch users
      const usersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users`,
        {
          headers,
        },
      );

      if (!usersResponse.ok) {
        throw new Error("Failed to fetch users");
      }

      const usersData = await usersResponse.json();

      // Fetch admin halls
      const hallsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/halls/admin`,
        {
          headers,
        },
      );

      if (!hallsResponse.ok) {
        throw new Error("Failed to fetch halls");
      }

      const hallsData = await hallsResponse.json();

      // Fetch bookings
      const bookingsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings`,
        {
          headers,
        },
      );

      if (!bookingsResponse.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const bookingsData = await bookingsResponse.json();

      setUsers(Array.isArray(usersData) ? usersData : usersData.value || []);
      setHalls(Array.isArray(hallsData) ? hallsData : hallsData.value || []);
      setBookings(
        Array.isArray(bookingsData) ? bookingsData : bookingsData.value || [],
      );
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError("Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("hallbook_user");

    if (!storedUser) {
      setError("Please login as an administrator.");
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (user.role !== "ADMIN") {
        setError("Access denied. Admin only.");
        setLoading(false);
        return;
      }

      loadDashboard();
    } catch {
      setError("Invalid user information.");
      setLoading(false);
    }
  }, []);

  async function updateBookingStatus(
    bookingId: number,
    status: "CONFIRMED" | "REJECTED" | "CANCELLED",
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to change booking #${bookingId} to ${status}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingBookingId(bookingId);

      const token = localStorage.getItem("hallbook_token");

      if (!token) {
        alert("Authentication token not found.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.message || "Failed to update booking");
      }

      await loadDashboard();
    } catch (err) {
      console.error("Booking update error:", err);
      alert(
        err instanceof Error ? err.message : "Failed to update booking status.",
      );
    } finally {
      setUpdatingBookingId(null);
    }
  }

  const totalUsers = users.length;

  const totalCustomers = users.filter(
    (user) => user.role === "CUSTOMER",
  ).length;

  const totalOwners = users.filter((user) => user.role === "OWNER").length;

  const totalAdmins = users.filter((user) => user.role === "ADMIN").length;

  const pendingBookings = bookings.filter(
    (booking) => booking.status === "PENDING",
  ).length;

  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "CONFIRMED",
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "CANCELLED",
  ).length;

  const rejectedBookings = bookings.filter(
    (booking) => booking.status === "REJECTED",
  ).length;

  if (loading) {
    return (
      <>
        <Header />

        <main className="min-h-screen bg-gray-50 px-6 py-10">
          <div className="mx-auto max-w-7xl">
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />

        <main className="min-h-screen bg-gray-50 px-6 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h1 className="text-xl font-semibold text-red-700">
                Admin Dashboard
              </h1>

              <p className="mt-2 text-red-600">{error}</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>

              <p className="mt-1 text-gray-600">
                Manage users, halls, and bookings.
              </p>
            </div>

            <button
              onClick={loadDashboard}
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Refresh Dashboard
            </button>
          </div>

          {/* User Summary */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              User Summary
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalUsers}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Customers</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalCustomers}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Owners</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalOwners}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Admins</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalAdmins}
                </p>
              </div>
            </div>
          </section>

          {/* Hall Summary */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Hall Summary
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Total Halls</p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {halls.length}
                </p>
              </div>
            </div>
          </section>

          {/* Booking Summary */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Booking Summary
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Pending</p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {pendingBookings}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Confirmed</p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {confirmedBookings}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Cancelled</p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {cancelledBookings}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">Rejected</p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {rejectedBookings}
                </p>
              </div>
            </div>
          </section>

          {/* Users */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              All Users
            </h2>

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>

                    <th className="px-4 py-3 text-left font-semibold">Name</th>

                    <th className="px-4 py-3 text-left font-semibold">Email</th>

                    <th className="px-4 py-3 text-left font-semibold">Role</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-gray-200">
                      <td className="px-4 py-3">{user.id}</td>

                      <td className="px-4 py-3 font-medium">{user.name}</td>

                      <td className="px-4 py-3">{user.email}</td>

                      <td className="px-4 py-3">{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Halls */}
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              All Halls
            </h2>

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Hall Name
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">Owner</th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Description
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Created By
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Creator Role
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Creator Email
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">City</th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Capacity
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">Price</th>
                  </tr>
                </thead>

                <tbody>
                  {halls.map((hall) => (
                    <tr key={hall.id} className="border-t border-gray-200">
                      <td className="px-4 py-3">{hall.id}</td>

                      <td className="px-4 py-3 font-medium">{hall.name}</td>

                      <td className="px-4 py-3">
                        {hall.owner?.name || "Not assigned"}
                      </td>

                      <td className="max-w-xs px-4 py-3">
                        {hall.description || "No description"}
                      </td>

                      <td className="px-4 py-3">
                        {hall.creator?.name || "Not recorded"}
                      </td>

                      <td className="px-4 py-3">
                        {hall.creator?.role || "Not recorded"}
                      </td>

                      <td className="px-4 py-3">
                        {hall.creator?.email || "Not recorded"}
                      </td>

                      <td className="px-4 py-3">{hall.city}</td>

                      <td className="px-4 py-3">{hall.capacity}</td>

                      <td className="px-4 py-3">₹{hall.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bookings */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              All Bookings
            </h2>

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">ID</th>

                    <th className="px-4 py-3 text-left font-semibold">Hall</th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Booking Date
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-gray-200">
                      <td className="px-4 py-3">{booking.id}</td>

                      <td className="px-4 py-3">
                        {booking.hall?.name || `Hall #${booking.hallId}`}
                      </td>

                      <td className="px-4 py-3">
                        {booking.user?.name || `User #${booking.userId}`}
                      </td>

                      <td className="px-4 py-3">{booking.bookingDate}</td>

                      <td className="px-4 py-3 font-medium">
                        {booking.status}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {booking.status === "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  updateBookingStatus(booking.id, "CONFIRMED")
                                }
                                disabled={updatingBookingId === booking.id}
                                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Confirm
                              </button>

                              <button
                                onClick={() =>
                                  updateBookingStatus(booking.id, "REJECTED")
                                }
                                disabled={updatingBookingId === booking.id}
                                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {booking.status === "CONFIRMED" && (
                            <button
                              onClick={() =>
                                updateBookingStatus(booking.id, "CANCELLED")
                              }
                              disabled={updatingBookingId === booking.id}
                              className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}

                          {booking.status === "CANCELLED" ||
                          booking.status === "REJECTED" ? (
                            <span className="text-xs text-gray-500">
                              No actions
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
