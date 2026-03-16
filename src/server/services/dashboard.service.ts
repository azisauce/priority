/* eslint-disable @typescript-eslint/no-explicit-any */

import { calculatePriorityPriceScore } from "@/lib/priority";
import {
  getAllItemsByUser,
  getItemsAggregationByUser,
  getRecentItemsByUser,
  getTotalGroupsResultByUser,
  getTotalItemsResultByUser,
} from "@/server/repositories/dashboard.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

export async function getDashboardForUser(
  userId: string
): Promise<
  ServiceResult<{
    totalItems: number;
    totalGroups: number;
    totalValue: number;
    averagePriority: number;
    topItems: Array<{
      id: string;
      itemName: string;
      pricing: number;
      priority: number;
      groupId: string;
      score: number;
    }>;
    recentItems: any[];
  }>
> {
  const [totalItemsResult, totalGroupsResult, allItems, recentItems] = await Promise.all([
    getTotalItemsResultByUser(userId),
    getTotalGroupsResultByUser(userId),
    getAllItemsByUser(userId),
    getRecentItemsByUser(userId),
  ]);

  const totalItems = parseInt((totalItemsResult?.count as string) || "0");
  const totalGroups = parseInt((totalGroupsResult?.count as string) || "0");

  const aggregation = await getItemsAggregationByUser(userId);

  const totalValue = Number(aggregation?.sum_price) || 0;
  const averagePriority = aggregation?.avg_priority
    ? Math.round(Number(aggregation.avg_priority) * 100) / 100
    : 0;

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

  return {
    status: 200,
    body: {
      totalItems,
      totalGroups,
      totalValue,
      averagePriority,
      topItems: scoredItems,
      recentItems: recentItems.map((item) => ({
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
    },
  };
}
