import { z } from "zod";

export const createParamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().nullable().optional(),
  weight: z
    .number()
    .int("Weight must be a whole number")
    .min(1, "Weight must be at least 1")
    .max(10, "Weight must be at most 10"),
});

export const updateParamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  weight: z.number().int().min(1).max(10).optional(),
});

export const assignParamEvalItemSchema = z.object({
  paramEvalItemId: z.string().min(1, "Eval item ID is required"),
});
