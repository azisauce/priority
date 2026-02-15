"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";

interface ProfileData {
  id: string;
  username: string;
  userImage: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit fields
  const [username, setUsername] = useState("");
  const [userImage, setUserImage] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Status
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setUsername(data.username);
        setUserImage(data.userImage || "");
      }
    } catch {
      showMessage("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const body: Record<string, string> = { username };
      if (userImage) body.userImage = userImage;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.error || "Failed to update profile", "error");
        return;
      }

      setProfile(data);
      await updateSession();
      showMessage("Profile updated successfully", "success");
    } catch {
      showMessage("An unexpected error occurred", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showMessage("New password must be at least 6 characters", "error");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showMessage("New passwords do not match", "error");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.error || "Failed to change password", "error");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      showMessage("Password changed successfully", "success");
    } catch {
      showMessage("An unexpected error occurred", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-100">Profile</h1>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${messageType === "success"
            ? "bg-green-600/10 border border-green-600/20 text-green-400"
            : "bg-red-600/10 border border-red-600/20 text-red-400"
            }`}
        >
          {message}
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {profile?.userImage ? (
            <img
              src={profile.userImage}
              alt={profile.username}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-800 ring-2 ring-gray-700"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-gray-900 ring-2 ring-gray-700 flex items-center justify-center">
              <User className="w-12 h-12 text-gray-500" />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold text-gray-100 mb-1">
              {profile?.username}
            </h2>
            <p className="text-gray-400">
              Joined{" "}
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
                : "Unknown date"}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700 font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Edit Profile */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            Edit Profile
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label
                htmlFor="edit-username"
                className="block text-sm font-medium text-gray-400 mb-1.5"
              >
                Username
              </label>
              <input
                id="edit-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="edit-image"
                className="block text-sm font-medium text-gray-400 mb-1.5"
              >
                Profile Image URL
              </label>
              <input
                id="edit-image"
                type="url"
                value={userImage}
                onChange={(e) => setUserImage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            Change Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label
                htmlFor="current-password"
                className="block text-sm font-medium text-gray-400 mb-1.5"
              >
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-400 mb-1.5"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="block text-sm font-medium text-gray-400 mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
