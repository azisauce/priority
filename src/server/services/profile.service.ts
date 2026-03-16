import bcrypt from "bcryptjs";
import {
  getUserById,
  getUserByUsername,
  getUserProfileById,
  updateUserById,
} from "@/server/repositories/profile.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

export async function getProfileForUser(
  userId: string
): Promise<ServiceResult<{ error: string } | { user: { id: string; username: string; userImage: string; createdAt: string } }>> {
  const user = await getUserProfileById(userId);

  if (!user) {
    return {
      status: 404,
      body: { error: "User not found" },
    };
  }

  return {
    status: 200,
    body: {
      user: {
        id: user.id,
        username: user.username,
        userImage: user.image_url,
        createdAt: user.created_at,
      },
    },
  };
}

export async function updateProfileForUser(
  userId: string,
  data: {
    username?: string;
    userImage?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }
): Promise<ServiceResult<{ error: string } | { user: { id: string; username: string; userImage: string; createdAt: string } }>> {
  const { username, userImage, currentPassword, newPassword } = data;

  const user = await getUserById(userId);
  if (!user) {
    return {
      status: 404,
      body: { error: "User not found" },
    };
  }

  if (username && username !== user.username) {
    const existing = await getUserByUsername(username);
    if (existing) {
      return {
        status: 409,
        body: { error: "Username already taken" },
      };
    }
  }

  if (newPassword && currentPassword) {
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return {
        status: 400,
        body: { error: "Current password is incorrect" },
      };
    }
  }

  const updateData: Record<string, unknown> = {};
  if (username !== undefined) updateData.username = username;
  if (userImage !== undefined) updateData.image_url = userImage;
  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const updated = await updateUserById(userId, updateData);

  return {
    status: 200,
    body: {
      user: {
        id: updated.id,
        username: updated.username,
        userImage: updated.image_url,
        createdAt: updated.created_at,
      },
    },
  };
}
