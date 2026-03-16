import db from "@/lib/db";

export async function getUserImageById(userId: string) {
  return db("users").where({ id: userId }).select("image_url").first();
}
