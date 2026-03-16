import db from "@/lib/db";

export async function findUserByUsername(username: string) {
  return db("users").where({ username }).first();
}

export async function createUser(data: {
  username: string;
  password: string;
  image_url: string | null;
}) {
  const [user] = await db("users").insert(data).returning("*");
  return user;
}
