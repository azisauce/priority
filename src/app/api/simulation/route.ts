import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { simulatePurchases } from "@/lib/priority";
import { z } from "zod";
import db from "@/lib/db";

const simulationSchema = z.object({
  initialBudget: z.number().min(0, "Initial budget must be non-negative"),
  monthlyIncome: z.number().min(0, "Monthly income must be non-negative"),
  deadlineMonths: z.number().int().positive().optional(),
  maxPriceThreshold: z.number().min(0).optional(),
  groupIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = simulationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { initialBudget, monthlyIncome, deadlineMonths, maxPriceThreshold, groupIds } = parsed.data;

  let query = db("items").where("items.user_id", userId);
  // Exclude items marked as done from simulations
  query = query.andWhere("items.is_done", false);
  if (groupIds && groupIds.length > 0) {
    query = query.whereIn("group_id", groupIds);
  }
  if (typeof maxPriceThreshold === "number") {
    query = query.andWhere("items.price", "<=", maxPriceThreshold);
  }

  const items = await query.select("id", "name", "price", "priority");

  const formattedItems = items.map(item => ({
    id: item.id,
    itemName: item.name,
    pricing: Number(item.price),
    priority: Number(item.priority),
  }));

  const result = simulatePurchases(
    formattedItems,
    initialBudget,
    monthlyIncome,
    deadlineMonths,
    maxPriceThreshold
  );

  return NextResponse.json({ simulation: result });
}
