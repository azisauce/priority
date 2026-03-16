import { z } from "zod";

export const createCounterpartySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});

export const updateCounterpartySchema = z.object({
  name: z.string().min(1).max(200).optional(),
});
