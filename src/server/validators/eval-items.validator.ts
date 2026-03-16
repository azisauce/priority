import { z } from "zod";

export const createEvalItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().nullable().optional(),
  value: z
    .number({ message: "Value is required" })
    .int("Value must be a whole number")
    .min(1, "Value must be at least 1")
    .max(5, "Value must be at most 5"),
});

export const updateEvalItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  value: z.number().min(1).max(5).optional(),
});
