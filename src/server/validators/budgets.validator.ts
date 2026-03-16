import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), {
    message: "Invalid date",
  });

const monthSchema = isoDateSchema.refine((value) => value.endsWith("-01"), {
  message: "Month must be the first day of month (YYYY-MM-01)",
});

export const CreateBudgetSchema = z.object({
  category: z.string().min(1, "Category is required").max(100),
  month: monthSchema,
  allocatedAmount: z.number().positive("Allocated amount must be positive"),
  rollover: z.boolean().optional().default(false),
});

export const UpdateBudgetSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  month: monthSchema.optional(),
  allocatedAmount: z.number().positive().optional(),
  rollover: z.boolean().optional(),
  rolledOverAmount: z.number().min(0).optional(),
});

export const CopyPreviousMonthSchema = z.object({
  month: monthSchema,
});
