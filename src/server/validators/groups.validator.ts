import { z } from "zod";

export const createGroupSchema = z.object({
  groupName: z.string().min(1, "Group name is required").max(100),
  description: z.string().nullable().optional(),
  priorityItemIds: z.array(z.string()).nullable().optional(),
});

export const updateGroupSchema = z.object({
  groupName: z.string().min(1, "Group name is required").max(100).optional(),
  description: z.string().nullable().optional(),
});

export const assignPriorityParamSchema = z.object({
  priorityParamId: z.string().min(1, "Priority param ID is required"),
});
