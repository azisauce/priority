import { z } from "zod";

export const updateProfileSchema = z
  .object({
    username: z.string().min(1).max(50).optional(),
    userImage: z
      .string()
      .nullable()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          return val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/");
        },
        { message: "Must be a valid URL or path" }
      ),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) return false;
      return true;
    },
    { message: "Current password is required to set a new password", path: ["currentPassword"] }
  );
