import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import crypto from "crypto";
import db from "@/lib/db";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Get user's current image to delete it later
    const user = await db("users")
      .where({ id: session.user.id })
      .select("image_url")
      .first();

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const ext = file.name.split(".").pop() || "jpg";
    const hash = crypto.createHash("md5").update(buffer).digest("hex");
    const filename = `${session.user.id}_${hash}.${ext}`;

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Delete old image if it exists and is a local file (not an external URL)
    if (user?.image_url && user.image_url.startsWith("/uploads/avatars/")) {
      const oldFilename = user.image_url.split("/").pop();
      if (oldFilename && oldFilename !== filename) {
        const oldFilepath = join(uploadDir, oldFilename);
        try {
          if (existsSync(oldFilepath)) {
            await unlink(oldFilepath);
          }
        } catch (error) {
          console.error("Failed to delete old image:", error);
          // Continue even if deletion fails
        }
      }
    }

    // Return the public path
    const publicPath = `/uploads/avatars/${filename}`;

    return NextResponse.json({ path: publicPath }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
