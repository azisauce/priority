export interface PriorityAnswer {
  value: number;
  weight: number;
}

export function calculatePriority(answers: PriorityAnswer[]): number {
  if (answers.length === 0) return 0;
  const totalWeight = answers.reduce((sum, a) => sum + a.weight, 0);
  if (totalWeight === 0) return 0;
  const score = answers.reduce((sum, a) => sum + a.value * a.weight, 0) / totalWeight;
  return Math.round(score * 100) / 100;
}

export function calculatePriorityPriceScore(priority: number, price: number): number {
  if (price <= 0) return Infinity;
  const alpha = 5;
  const beta = 1;
  return Math.pow(priority, alpha) / Math.pow(price, beta);
}

export interface SimulationResult {
  totalMonths: number;
  monthlyPurchases: { month: number; items: { id: string; itemName: string; pricing: number; priority: number; score: number }[]; spent: number; remaining: number }[];
  totalSpent: number;
  unpurchased: { id: string; itemName: string; pricing: number; priority: number }[];
}

export function simulatePurchases(
  items: { id: string; itemName: string; pricing: number; priority: number }[],
  initialBudget: number,
  monthlyIncome: number,
  deadlineMonths?: number,
  maxPriceThreshold?: number
): SimulationResult {
  // Optionally filter out items above the threshold
  const considered = typeof maxPriceThreshold === "number"
    ? items.filter((it) => it.pricing <= maxPriceThreshold)
    : items.slice();

  // Sort items by priority-price score descending
  const scoredItems = considered.map(item => ({
    ...item,
    score: calculatePriorityPriceScore(item.priority, item.pricing),
  })).sort((a, b) => b.score - a.score);

  const monthlyPurchases: SimulationResult['monthlyPurchases'] = [];
  let budget = initialBudget;
  let remaining = [...scoredItems];
  let month = 0;
  const maxMonths = deadlineMonths ?? 120; // default max 10 years

  while (remaining.length > 0 && month < maxMonths) {
    if (month > 0) budget += monthlyIncome;
    month++;

    const purchased: typeof scoredItems = [];
    const stillRemaining: typeof scoredItems = [];

    for (const item of remaining) {
      if (item.pricing <= budget) {
        purchased.push(item);
        budget -= item.pricing;
      } else {
        stillRemaining.push(item);
      }
    }

    if (purchased.length > 0) {
      monthlyPurchases.push({
        month,
        items: purchased,
        spent: purchased.reduce((sum, i) => sum + i.pricing, 0),
        remaining: budget,
      });
    }

    remaining = stillRemaining;

    // If nothing was purchased and budget didn't grow enough, still continue
    if (purchased.length === 0 && monthlyIncome <= 0) break;
  }

  return {
    totalMonths: month,
    monthlyPurchases,
    totalSpent: monthlyPurchases.reduce((sum, m) => sum + m.spent, 0),
    unpurchased: remaining.map(({ score: _score, ...rest }) => rest),
  };
}
