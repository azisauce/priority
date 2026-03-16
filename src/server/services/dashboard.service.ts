/* eslint-disable @typescript-eslint/no-explicit-any */

import { calculatePriorityPriceScore } from "@/lib/priority";
import {
  getCurrentMonthBudgetsSummary,
  getCurrentMonthPaymentsSummary,
  getAllItemsByUser,
  getItemsAggregationByUser,
  getRecentExpenses,
  getRecentItemsByUser,
  getTotalGroupsResultByUser,
  getTotalItemsResultByUser,
  getUpcomingDues,
} from "@/server/repositories/dashboard.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

function daysUntil(dateString: string): number {
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const target = new Date(`${dateString}T00:00:00.000Z`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.ceil((target.getTime() - todayUtc.getTime()) / millisecondsPerDay);

  return Math.max(diff, 0);
}

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
    paymentsSummary: {
      month: string;
      totalIncome: number;
      totalExpenses: number;
      fixedExpenses: number;
      net: number;
      paidCount: number;
      unpaidCount: number;
      payments: Array<{
        id: string;
        name: string;
        type: "income" | "expense";
        category: string | null;
        dayOfMonth: number;
        amount: number;
        isVariable: boolean;
        isPaid: boolean;
        paidAt: string | null;
      }>;
    };
    budgetsSummary: Array<{
      id: string;
      category: string;
      month: string;
      allocatedAmount: number;
      rolledOverAmount: number;
      totalAllocatedAmount: number;
      spentAmount: number;
      remainingAmount: number;
      spentPercent: number;
      isOver80Percent: boolean;
    }>;
    recentExpenses: Array<{
      id: string;
      amount: number;
      note: string | null;
      date: string;
      createdAt: string;
      budgetCategory: string | null;
    }>;
    upcomingDues: Array<{
      id: string;
      name: string;
      counterparty: string | null;
      direction: "i_owe" | "they_owe";
      status: "active" | "paid" | "overdue";
      deadline: string;
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
      daysUntilDeadline: number;
    }>;
    recentItems: any[];
  }>
> {
  const [
    totalItemsResult,
    totalGroupsResult,
    allItems,
    recentItems,
    aggregation,
    paymentsSummary,
    budgetsSummary,
    recentExpenses,
    upcomingDues,
  ] = await Promise.all([
    getTotalItemsResultByUser(userId),
    getTotalGroupsResultByUser(userId),
    getAllItemsByUser(userId),
    getRecentItemsByUser(userId),
    getItemsAggregationByUser(userId),
    getCurrentMonthPaymentsSummary(userId),
    getCurrentMonthBudgetsSummary(userId),
    getRecentExpenses(userId, 5),
    getUpcomingDues(userId, 7),
  ]);

  const totalItems = parseInt((totalItemsResult?.count as string) || "0");
  const totalGroups = parseInt((totalGroupsResult?.count as string) || "0");

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
      paymentsSummary: {
        month: paymentsSummary.month,
        totalIncome: Number(paymentsSummary.total_income ?? 0),
        totalExpenses: Number(paymentsSummary.total_expenses ?? 0),
        fixedExpenses: Number(paymentsSummary.fixed_expenses ?? 0),
        net: Number(paymentsSummary.net ?? 0),
        paidCount: Number(paymentsSummary.paid_count ?? 0),
        unpaidCount: Number(paymentsSummary.unpaid_count ?? 0),
        payments: paymentsSummary.payments.map((payment) => ({
          id: payment.id,
          name: payment.name,
          type: payment.type,
          category: payment.category,
          dayOfMonth: payment.day_of_month,
          amount: Number(payment.amount ?? 0),
          isVariable: Boolean(payment.is_variable),
          isPaid: Boolean(payment.is_paid),
          paidAt: payment.paid_at,
        })),
      },
      budgetsSummary: budgetsSummary.map((budget) => ({
        id: budget.id,
        category: budget.category,
        month: budget.month,
        allocatedAmount: Number(budget.allocated_amount ?? 0),
        rolledOverAmount: Number(budget.rolled_over_amount ?? 0),
        totalAllocatedAmount: Number(budget.total_allocated_amount ?? 0),
        spentAmount: Number(budget.spent_amount ?? 0),
        remainingAmount: Number(budget.remaining_amount ?? 0),
        spentPercent: Number(budget.spent_percent ?? 0),
        isOver80Percent: Boolean(budget.is_over_80_percent),
      })),
      recentExpenses: recentExpenses.map((expense) => ({
        id: expense.id,
        amount: Number(expense.amount ?? 0),
        note: expense.note,
        date: expense.date,
        createdAt: expense.created_at,
        budgetCategory: expense.budget_category ?? null,
      })),
      upcomingDues: upcomingDues.map((due) => ({
        id: due.id,
        name: due.name,
        counterparty: due.counterparty ?? null,
        direction: due.direction,
        status: due.status,
        deadline: due.deadline,
        totalAmount: Number(due.total_amount ?? 0),
        paidAmount: Number(due.paid_amount ?? 0),
        remainingAmount: Number(due.remaining_amount ?? 0),
        daysUntilDeadline: daysUntil(due.deadline),
      })),
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
