import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { getUserImageById } from "@/server/repositories/upload.repository";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

type ServiceResult<T> = {
  status: number;
  body: T;
};

export async function uploadAvatarForUser(
  userId: string,
  file: File | null
): Promise<ServiceResult<{ error: string } | { path: string }>> {
  if (!file) {
    return { status: 400, body: { error: "No file provided" } };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      status: 400,
      body: {
        error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
      },
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      status: 400,
      body: { error: "File too large. Maximum size is 5MB." },
    };
  }

  const user = await getUserImageById(userId);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() || "jpg";
  const hash = crypto.createHash("md5").update(buffer).digest("hex");
  const filenameBase = `${userId}_${hash}`;

  const useCloudinary = Boolean(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY);

  if (useCloudinary) {
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

      if (
        user?.image_url &&
        user.image_url.includes("res.cloudinary.com") &&
        user.image_url.includes(filenameBase) === false
      ) {
        const match = user.image_url.match(
          /\/(?:uploads\/avatars\/)?([A-Za-z0-9_-]+_[0-9a-f]{32})(?:\.[a-zA-Z0-9]+)$/
        );

        if (match && match[1]) {
          const oldPublicId = `uploads/avatars/${match[1]}`;
          try {
            await cloudinary.uploader.destroy(oldPublicId, { resource_type: "image" });
          } catch (error) {
            console.error("Failed to delete old cloudinary image:", error);
          }
        }
      }

      return {
        status: 200,
        body: { path: uploadRes.secure_url },
      };
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      return {
        status: 500,
        body: { error: "Failed to upload file" },
      };
    }
  }

  const filename = `${filenameBase}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "avatars");

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);

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
      }
    }
  }

  const publicPath = `/uploads/avatars/${filename}`;

  return {
    status: 200,
    body: { path: publicPath },
  };
}
