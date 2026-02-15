"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userImage, setUserImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          confirmPassword,
          ...(userImage && { userImage }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Registration succeeded but sign in failed. Please log in manually.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          <h1 className="text-3xl font-bold text-gray-100 text-center mb-8">
            Priority.
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-400 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-400 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-400 mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label
                htmlFor="userImage"
                className="block text-sm font-medium text-gray-400 mb-1.5"
              >
                Profile Image URL{" "}
                <span className="text-gray-500">(optional)</span>
              </label>
              <input
                id="userImage"
                type="url"
                value={userImage}
                onChange={(e) => setUserImage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
