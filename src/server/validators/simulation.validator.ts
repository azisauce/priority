import { z } from "zod";

export const simulationSchema = z.object({
  initialBudget: z.number().min(0, "Initial budget must be non-negative"),
  monthlyIncome: z.number().min(0, "Monthly income must be non-negative"),
  deadlineMonths: z.number().int().positive().optional(),
  maxPriceThreshold: z.number().min(0).optional(),
  useEase: z.boolean().optional(),
  formula: z.enum(["greedy", "optimal"]).optional(),
  groupIds: z.array(z.string()).optional(),
});
