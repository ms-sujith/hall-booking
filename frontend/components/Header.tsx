"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "OWNER" | "ADMIN";
};

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const storedUser = localStorage.getItem("hallbook_user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to read logged-in user:", error);
        setUser(null);
      }
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("hallbook_token");
    localStorage.removeItem("hallbook_user");

    window.location.href = "/";
  }

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <a href="/" className="block">
          <h1 className="text-2xl font-bold tracking-tight">
            Hall<span className="text-indigo-600">Book</span>
          </h1>

          <p className="text-xs text-zinc-500">Find. Book. Celebrate.</p>
        </a>

        {/* Navigation */}
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
            href="/#about"
            className="text-sm font-medium hover:text-indigo-600"
          >
            About
          </a>

          {mounted && user?.role === "CUSTOMER" && (
            <a
              href="/my-bookings"
              className="text-sm font-medium hover:text-indigo-600"
            >
              My Bookings
            </a>
          )}

          {mounted && user?.role === "OWNER" && (
            <a
              href="/owner-bookings"
              className="text-sm font-medium hover:text-indigo-600"
            >
              Owner Dashboard
            </a>
          )}

          {mounted && user?.role === "ADMIN" && (
            <a
              href="/admin"
              className="text-sm font-medium hover:text-indigo-600"
            >
              Admin Dashboard
            </a>
          )}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {mounted && user ? (
            <>
              <span className="hidden text-sm text-zinc-600 sm:block">
                Hi, {user.name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Login
              </a>

              <button
                type="button"
                className="hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:block"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
