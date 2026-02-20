import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

const updateProfileSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  userImage: z.string().nullable().optional().refine(
    (val) => {
      if (!val) return true; // null or empty is fine
      // Accept URLs or paths starting with /
      return val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/");
    },
    { message: "Must be a valid URL or path" }
  ),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) return false;
    return true;
  },
  { message: "Current password is required to set a new password", path: ["currentPassword"] }
);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await db("users")
    .where({ id: userId })
    .select("id", "username", "image_url", "created_at")
    .first();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ 
    user: {
      id: user.id,
      username: user.username,
      userImage: user.image_url,
      createdAt: user.created_at,
    }
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { username, userImage, currentPassword, newPassword } = parsed.data;

  const user = await db("users").where({ id: userId }).first();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check username uniqueness
  if (username && username !== user.username) {
    const existing = await db("users").where({ username }).first();
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
  }

  // Verify current password if changing password
  if (newPassword && currentPassword) {
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (username !== undefined) updateData.username = username;
  if (userImage !== undefined) updateData.image_url = userImage;
  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const [updated] = await db("users")
    .where({ id: userId })
    .update(updateData)
    .returning(["id", "username", "image_url", "created_at"]);

  return NextResponse.json({ 
    user: {
      id: updated.id,
      username: updated.username,
      userImage: updated.image_url,
      createdAt: updated.created_at,
    }
  });
}
