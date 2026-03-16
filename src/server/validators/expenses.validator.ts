import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), {
    message: "Invalid date",
  });

export const CreateExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  budgetId: z.uuid().nullable().optional(),
  note: z.string().nullable().optional(),
  date: isoDateSchema,
});

export const UpdateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  budgetId: z.uuid().nullable().optional(),
  note: z.string().nullable().optional(),
  date: isoDateSchema.optional(),
});
