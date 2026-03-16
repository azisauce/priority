import { z } from "zod";

export const registerSchema = z
  .object({
    username: z.string().min(3).max(30),
    password: z.string().min(6),
    confirmPassword: z.string(),
    userImage: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
