import { simulatePurchases, simulatePurchasesOptimal } from "@/lib/priority";
import { getSimulationItems } from "@/server/repositories/simulation.repository";

type ServiceResult<T> = {
  status: number;
  body: T;
};

export async function runSimulationForUser(
  userId: string,
  data: {
    initialBudget: number;
    monthlyIncome: number;
    deadlineMonths?: number;
    maxPriceThreshold?: number;
    useEase?: boolean;
    formula?: "greedy" | "optimal";
    groupIds?: string[];
  }
): Promise<ServiceResult<{ simulation: unknown }>> {
  const {
    initialBudget,
    monthlyIncome,
    deadlineMonths,
    maxPriceThreshold,
    groupIds,
    useEase,
    formula,
  } = data;

  const items = await getSimulationItems(userId, groupIds, maxPriceThreshold);

  const formattedItems = items.map((item) => ({
    id: item.id,
    itemName: item.name,
    pricing: Number(item.price),
    priority: Number(item.priority),
    ease: item.installment_enabled
      ? {
          priceWithInterest: item.total_price_with_interest
            ? Number(item.total_price_with_interest)
            : undefined,
          interestPercentage: item.interest_percentage ? Number(item.interest_percentage) : undefined,
          easePeriod: Number(item.installment_period_months) || 0,
        }
      : undefined,
  }));

  const useEaseBool = typeof useEase === "boolean" ? useEase : true;

  let result;
  if (formula === "optimal") {
    result = simulatePurchasesOptimal(
      formattedItems,
      initialBudget,
      monthlyIncome,
      deadlineMonths,
      maxPriceThreshold,
      useEaseBool
    );
  } else {
    result = simulatePurchases(
      formattedItems,
      initialBudget,
      monthlyIncome,
      deadlineMonths,
      maxPriceThreshold,
      useEaseBool
    );
  }

  return {
    status: 200,
    body: { simulation: result },
  };
}
