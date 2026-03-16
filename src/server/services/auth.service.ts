import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createUser, findUserByUsername } from "@/server/repositories/auth.repository";

export type ServiceResult<T> = {
  status: number;
  body: T;
};

export async function requireAuthenticatedUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user.id;
}

export async function registerUser(data: {
  username: string;
  password: string;
  userImage?: string;
}): Promise<ServiceResult<{ error: string } | { message: string; userId: string }>> {
  const existingUser = await findUserByUsername(data.username);

  if (existingUser) {
    return {
      status: 409,
      body: { error: "Username already taken" },
    };
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await createUser({
    username: data.username,
    password: hashedPassword,
    image_url: data.userImage || null,
  });

  return {
    status: 201,
    body: {
      message: "User created successfully",
      userId: user.id,
    },
  };
}
