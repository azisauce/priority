import { z } from "zod";

export const createItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required").max(200),
  description: z.string().nullable().optional(),
  groupId: z.string().min(1, "Group ID is required"),
  pricing: z.number().positive("Price must be positive"),
  enabledEaseOption: z.boolean().nullable().optional(),
  easePeriod: z.number().int().nullable().optional(),
  interestPercentage: z.number().nullable().optional(),
  priceWithInterest: z.number().nullable().optional(),
  priority: z.number().optional(),
  value: z.number().optional(),
  answers: z
    .array(
      z.object({
        priorityParamId: z.string().min(1),
        paramEvalItemId: z.string().min(1),
      })
    )
    .optional(),
});

export const updateItemSchema = z.object({
  itemName: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  groupId: z.string().min(1).optional(),
  pricing: z.number().positive().optional(),
  enabledEaseOption: z.boolean().optional(),
  easePeriod: z.number().int().nullable().optional(),
  interestPercentage: z.number().nullable().optional(),
  priceWithInterest: z.number().nullable().optional(),
  priority: z.number().optional(),
  value: z.number().optional(),
  isDone: z.boolean().optional(),
  is_done: z.boolean().optional(),
  answers: z
    .array(
      z.object({
        priorityParamId: z.string().min(1),
        paramEvalItemId: z.string().min(1),
      })
    )
    .optional(),
});
