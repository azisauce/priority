import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { simulatePurchases } from "@/lib/priority";
import { z } from "zod";

const simulationSchema = z.object({
  initialBudget: z.number().min(0, "Initial budget must be non-negative"),
  monthlyIncome: z.number().min(0, "Monthly income must be non-negative"),
  deadlineMonths: z.number().int().positive().optional(),
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

  const { initialBudget, monthlyIncome, deadlineMonths, groupIds } = parsed.data;

  const where: Record<string, unknown> = { userId };
  if (groupIds && groupIds.length > 0) {
    where.groupId = { in: groupIds };
  }

  const items = await prisma.item.findMany({
    where,
    select: { id: true, itemName: true, pricing: true, priority: true },
  });

  const result = simulatePurchases(items, initialBudget, monthlyIncome, deadlineMonths);

  return NextResponse.json({ simulation: result });
}
