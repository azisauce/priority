import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), {
    message: "Invalid date",
  });

const MonthlyPaymentBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  type: z.enum(["income", "expense"]),
  is_variable: z.boolean().optional(),
  default_amount: z.number().positive("Default amount must be positive"),
  day_of_month: z.number().int().min(1).max(31),
  start_month: isoDateSchema,
  end_month: isoDateSchema.nullable().optional(),
});

function isValidMonthRange(value: { start_month?: string; end_month?: string | null }) {
  if (!value.start_month || !value.end_month) {
    return true;
  }

  return (
    new Date(`${value.end_month}T00:00:00.000Z`).getTime() >=
    new Date(`${value.start_month}T00:00:00.000Z`).getTime()
  );
}

export const CreateMonthlyPaymentSchema = MonthlyPaymentBaseSchema.extend({
  is_variable: z.boolean().optional().default(false),
}).refine(isValidMonthRange, {
  message: "end_month must be after or equal to start_month",
  path: ["end_month"],
});

export const UpdateMonthlyPaymentSchema = MonthlyPaymentBaseSchema.partial().refine(
  isValidMonthRange,
  {
    message: "end_month must be after or equal to start_month",
    path: ["end_month"],
  }
);

export const MarkAsPaidSchema = z.object({
  month: isoDateSchema,
  amount: z.number().positive("Amount must be positive"),
});
