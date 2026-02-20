import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculatePriorityPriceScore } from "@/lib/priority";
import db from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [totalItemsResult, totalGroupsResult, allItems, recentItems] = await Promise.all([
    db("items").where("items.user_id", userId).count("* as count").first(),
    db("groups").where({ user_id: userId }).count("* as count").first(),
    db("items")
      .where("items.user_id", userId)
      .select("id", "name", "price", "priority", "group_id"),
    db("items")
      .where("items.user_id", userId)
      .orderBy("created_at", "desc")
      .limit(5)
      .select("items.*")
      .leftJoin("groups", "items.group_id", "groups.id")
      .select(
        "items.*",
        "groups.id as group_id",
        "groups.name as group_name",
        "groups.description as group_description"
      ),
  ]);

  const totalItems = parseInt(totalItemsResult?.count as string || "0");
  const totalGroups = parseInt(totalGroupsResult?.count as string || "0");

  // Calculate aggregations
  const aggregation = await db("items")
    .where({ user_id: userId })
    .sum("price as sum_price")
    .avg("priority as avg_priority")
    .first();

  const totalValue = Number(aggregation?.sum_price) || 0;
  const averagePriority = aggregation?.avg_priority
    ? Math.round(Number(aggregation.avg_priority) * 100) / 100
    : 0;

  // Calculate top 5 items by priority-price score
  const scoredItems = allItems
    .map((item) => ({
      id: item.id,
      itemName: item.name,
      pricing: Number(item.price),
      priority: Number(item.priority),
      groupId: item.group_id,
      score: calculatePriorityPriceScore(Number(item.priority), Number(item.price)),
    }))
    .filter((item) => isFinite(item.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return NextResponse.json({
    totalItems,
    totalGroups,
    totalValue,
    averagePriority,
    topItems: scoredItems,
    recentItems: recentItems.map(item => ({
      id: item.id,
      itemName: item.name,
      description: item.description,
      pricing: Number(item.price),
      priority: Number(item.priority),
      value: Number(item.value),
      userId: item.user_id,
      groupId: item.group_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      group: {
        id: item.group_id,
        groupName: item.group_name,
        description: item.group_description,
      },
    })),
  });
}
