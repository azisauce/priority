import db from "@/lib/db";

export async function getUserProfileById(userId: string) {
  return db("users")
    .where({ id: userId })
    .select("id", "username", "image_url", "created_at")
    .first();
}

export async function getUserById(userId: string) {
  return db("users").where({ id: userId }).first();
}

export async function getUserByUsername(username: string) {
  return db("users").where({ username }).first();
}

export async function updateUserById(userId: string, updateData: Record<string, unknown>) {
  const [updated] = await db("users")
    .where({ id: userId })
    .update(updateData)
    .returning(["id", "username", "image_url", "created_at"]);

  return updated;
}
