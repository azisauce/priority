import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePriorityPriceScore } from "@/lib/priority";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [totalItems, totalGroups, aggregation, allItems, recentItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.group.count({ where: { userId } }),
    prisma.item.aggregate({
      where: { userId },
      _sum: { pricing: true },
      _avg: { priority: true },
    }),
    prisma.item.findMany({
      where: { userId },
      select: { id: true, itemName: true, pricing: true, priority: true, groupId: true },
    }),
    prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { group: true },
    }),
  ]);

  const totalValue = aggregation._sum.pricing ?? 0;
  const averagePriority = aggregation._avg.priority
    ? Math.round(aggregation._avg.priority * 100) / 100
    : 0;

  // Calculate top 5 items by priority-price score
  const scoredItems = allItems
    .map((item: { id: string; itemName: string; pricing: number; priority: number; groupId: string }) => ({
      ...item,
      score: calculatePriorityPriceScore(item.priority, item.pricing),
    }))
    .filter((item: { score: number }) => isFinite(item.score))
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
    .slice(0, 5);

  return NextResponse.json({
    totalItems,
    totalGroups,
    totalValue,
    averagePriority,
    topItems: scoredItems,
    recentItems,
  });
}
