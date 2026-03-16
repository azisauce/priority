import { z } from "zod";

export const createDebtSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  purpose: z.string().nullable().optional(),
  totalAmount: z.number().positive("Total amount must be positive"),
  counterparty: z.string().min(1, "Counterparty is required").max(200),
  startDate: z.string().min(1, "Start date is required"),
  deadline: z.string().nullable().optional(),
  status: z.enum(["active", "paid", "overdue"]).optional().default("active"),
  paymentPeriod: z.enum(["weekly", "monthly", "custom"]).optional().default("monthly"),
  fixedInstallmentAmount: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  type: z.enum(["debt", "asset"]).optional().default("debt"),
});

export const updateDebtSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  purpose: z.string().nullable().optional(),
  totalAmount: z.number().positive().optional(),
  counterparty: z.string().min(1).max(200).optional(),
  startDate: z.string().optional(),
  deadline: z.string().nullable().optional(),
  status: z.enum(["active", "paid", "overdue"]).optional(),
  paymentPeriod: z.enum(["weekly", "monthly", "custom"]).optional(),
  fixedInstallmentAmount: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentDate: z.string().min(1, "Payment date is required"),
  status: z.enum(["scheduled", "paid", "missed"]).optional().default("scheduled"),
  note: z.string().nullable().optional(),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  paymentDate: z.string().optional(),
  status: z.enum(["scheduled", "paid", "missed"]).optional(),
  note: z.string().nullable().optional(),
});
