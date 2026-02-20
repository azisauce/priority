import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
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

    // Generate unique filename/hash and buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "jpg";
    const hash = crypto.createHash("md5").update(buffer).digest("hex");
    const filenameBase = `${session.user.id}_${hash}`;

    // If Cloudinary is configured, upload to Cloudinary. Otherwise fall back to local disk.
    const useCloudinary = Boolean(
      process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY
    );

    if (useCloudinary) {
      // Configure Cloudinary (will read CLOUDINARY_URL if available)
      if (process.env.CLOUDINARY_URL) {
        cloudinary.config({ secure: true });
      } else {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true,
        });
      }

      try {
        const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
        const publicId = `uploads/avatars/${filenameBase}`;
        const uploadRes = await cloudinary.uploader.upload(dataUri, {
          public_id: publicId,
          overwrite: true,
          resource_type: "image",
        });

        // If previous image was stored in Cloudinary and matches our pattern, remove it
        if (user?.image_url && user.image_url.includes("res.cloudinary.com") && user.image_url.includes(filenameBase) === false) {
          // try to extract previous public_id using the same filename pattern
          const m = user.image_url.match(/\/(?:uploads\/avatars\/)?([A-Za-z0-9_-]+_[0-9a-f]{32})(?:\.[a-zA-Z0-9]+)$/);
          if (m && m[1]) {
            const oldPublicId = `uploads/avatars/${m[1]}`;
            try {
              await cloudinary.uploader.destroy(oldPublicId, { resource_type: "image" });
            } catch (err) {
              console.error("Failed to delete old cloudinary image:", err);
            }
          }
        }

        return NextResponse.json({ path: uploadRes.secure_url }, { status: 200 });
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
      }
    }

    // FALLBACK: local file storage (used when Cloudinary not configured)
    const filename = `${filenameBase}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

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

    // Return the public path for local file
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
