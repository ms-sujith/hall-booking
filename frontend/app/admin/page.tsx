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

type EditHallForm = {
  name: string;
  description: string;
  address: string;
  city: string;
  capacity: string;
  price: string;
  imageUrl: string;
  amenities: string;
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

  const [editingHall, setEditingHall] = useState<Hall | null>(null);

  const [editForm, setEditForm] = useState<EditHallForm>({
    name: "",
    description: "",
    address: "",
    city: "",
    capacity: "",
    price: "",
    imageUrl: "",
    amenities: "",
  });

  const [savingHall, setSavingHall] = useState(false);
  const [hallUpdateMessage, setHallUpdateMessage] = useState("");

  const [deletingHallId, setDeletingHallId] = useState<number | null>(null);

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

  function openEditHall(hall: Hall) {
    setEditingHall(hall);

    setHallUpdateMessage("");

    setEditForm({
      name: hall.name || "",
      description: hall.description || "",
      address: hall.address || "",
      city: hall.city || "",
      capacity: String(hall.capacity ?? ""),
      price: String(hall.price ?? ""),
      imageUrl: hall.imageUrl || "",
      amenities: hall.amenities || "",
    });
  }

  function closeEditHall() {
    if (savingHall) {
      return;
    }

    setEditingHall(null);
    setHallUpdateMessage("");
  }

  async function saveHallChanges() {
    if (!editingHall) {
      return;
    }

    if (!editForm.name.trim()) {
      setHallUpdateMessage("Hall name is required.");
      return;
    }

    if (!editForm.address.trim()) {
      setHallUpdateMessage("Address is required.");
      return;
    }

    if (!editForm.city.trim()) {
      setHallUpdateMessage("City is required.");
      return;
    }

    if (!editForm.capacity || Number(editForm.capacity) <= 0) {
      setHallUpdateMessage("Capacity must be greater than 0.");
      return;
    }

    if (!editForm.price || Number(editForm.price) < 0) {
      setHallUpdateMessage("Please enter a valid price.");
      return;
    }

    try {
      setSavingHall(true);
      setHallUpdateMessage("");

      const token = localStorage.getItem("hallbook_token");

      if (!token) {
        setHallUpdateMessage("Authentication token not found.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/halls/${editingHall.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editForm.name.trim(),
            description: editForm.description.trim() || null,
            address: editForm.address.trim(),
            city: editForm.city.trim(),
            capacity: Number(editForm.capacity),
            price: Number(editForm.price),
            imageUrl: editForm.imageUrl.trim() || null,
            amenities: editForm.amenities.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.message || "Failed to update hall");
      }

      await loadDashboard();

      setHallUpdateMessage("Hall updated successfully.");

      setTimeout(() => {
        setEditingHall(null);
        setHallUpdateMessage("");
      }, 800);
    } catch (err) {
      console.error("Hall update error:", err);

      setHallUpdateMessage(
        err instanceof Error ? err.message : "Failed to update hall.",
      );
    } finally {
      setSavingHall(false);
    }
  }

  async function deleteHall(hall: Hall) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${hall.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingHallId(hall.id);

      const token = localStorage.getItem("hallbook_token");

      if (!token) {
        alert("Authentication token not found.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/halls/${hall.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(data?.message || "Failed to delete hall");
      }

      await loadDashboard();

      alert(`"${hall.name}" was deleted successfully.`);
    } catch (err) {
      console.error("Hall delete error:", err);

      alert(err instanceof Error ? err.message : "Failed to delete hall.");
    } finally {
      setDeletingHallId(null);
    }
  }

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

                    <th className="px-4 py-3 text-left font-semibold">
                      Actions
                    </th>
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

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {/* View */}
                          <a
                            href={`/halls/${hall.id}`}
                            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                          >
                            View
                          </a>

                          {/* Edit */}
                          <button
                            onClick={() => openEditHall(hall)}
                            disabled={deletingHallId === hall.id}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteHall(hall)}
                            disabled={deletingHallId === hall.id}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingHallId === hall.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
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

      {/* Edit Hall Modal */}
      {editingHall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Hall
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Hall #{editingHall.id}
                </p>
              </div>

              <button
                onClick={closeEditHall}
                disabled={savingHall}
                className="text-2xl leading-none text-gray-500 hover:text-gray-900 disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {hallUpdateMessage && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    hallUpdateMessage === "Hall updated successfully."
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {hallUpdateMessage}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Hall Name
                </label>

                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Hall name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Hall description"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Address
                  </label>

                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        address: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Address"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    City
                  </label>

                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        city: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Capacity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={editForm.capacity}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        capacity: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Capacity"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={editForm.price}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        price: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Price"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Image URL
                </label>

                <input
                  type="text"
                  value={editForm.imageUrl}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      imageUrl: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Amenities
                </label>

                <input
                  type="text"
                  value={editForm.amenities}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      amenities: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Parking, AC, Dining Hall"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeEditHall}
                disabled={savingHall}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={saveHallChanges}
                disabled={savingHall}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingHall ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
