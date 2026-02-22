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
  monthlyPurchases: { month: number; items: { id: string; itemName: string; pricing: number; priority: number; score: number; isInstallment?: boolean; monthlyPayment?: number }[]; spent: number; remaining: number }[];
  totalSpent: number;
  unpurchased: { id: string; itemName: string; pricing: number; priority: number }[];
}
export interface ItemEase {
  priceWithInterest?: number;
  interestPercentage?: number;
  easePeriod: number;
}

export interface ItemInput {
  id: string;
  itemName: string;
  pricing: number;
  priority: number;
  ease?: ItemEase | undefined;
}

export function simulatePurchases(
  items: ItemInput[],
  initialBudget: number,
  monthlyIncome: number,
  deadlineMonths?: number,
  maxPriceThreshold?: number
): SimulationResult {
  const considered = typeof maxPriceThreshold === "number"
    ? items.filter((it) => it.pricing <= maxPriceThreshold)
    : items.slice();

  const monthlyPurchases: SimulationResult['monthlyPurchases'] = [];
  let budget = initialBudget;
  let remaining: ItemInput[] = considered.slice();
  let month = 0;
  const maxMonths = deadlineMonths ?? 120;

  type ActiveInstallment = {
    id: string;
    monthlyPayment: number;
    remainingMonths: number;
    remainingAmount: number;
    itemName: string;
    priority: number;
  };

  const activeInstallments: ActiveInstallment[] = [];

  while (remaining.length > 0 && month < maxMonths) {
    if (month > 0) budget += monthlyIncome;
    month++;

    // Deduct active installments for this month
      const installmentPayment = activeInstallments.reduce((sum, a) => sum + a.monthlyPayment, 0);
      let monthSpent = 0;
      if (installmentPayment > 0) {
        budget -= installmentPayment;
        monthSpent += installmentPayment;
        // update installments
        for (let i = activeInstallments.length - 1; i >= 0; i--) {
          const inst = activeInstallments[i];
          inst.remainingAmount -= inst.monthlyPayment;
          inst.remainingMonths -= 1;
          if (inst.remainingMonths <= 0 || inst.remainingAmount <= 0) {
            activeInstallments.splice(i, 1);
          }
        }
      }

      const purchased: { id: string; itemName: string; pricing: number; priority: number; score: number; isInstallment?: boolean; monthlyPayment?: number }[] = [];
    const stillRemaining: ItemInput[] = [];

    // Recalculate score using effective price (priceWithInterest if ease exists)
    const scored = remaining.map((item) => {
      const effectivePrice = item.ease && item.ease.priceWithInterest ? item.ease.priceWithInterest : item.pricing;
      return {
        item,
        score: calculatePriorityPriceScore(item.priority, effectivePrice),
      };
    }).sort((a, b) => b.score - a.score);

    for (const s of scored) {
      const item = s.item;
      // Prefer cash if affordable
      if (item.pricing <= budget) {
        purchased.push({ id: item.id, itemName: item.itemName, pricing: item.pricing, priority: item.priority, score: s.score, isInstallment: false });
        budget -= item.pricing;
        monthSpent += item.pricing;
        continue;
      }

      // Try ease option if available and has a valid period and priceWithInterest
      if (item.ease && item.ease.easePeriod > 0 && item.ease.priceWithInterest && item.ease.priceWithInterest > 0) {
        const monthlyPayment = item.ease.priceWithInterest / item.ease.easePeriod;
        // require that we can at least pay the first installment this month
        if (monthlyPayment <= budget) {
          purchased.push({ id: item.id, itemName: item.itemName, pricing: item.ease.priceWithInterest, priority: item.priority, score: s.score, isInstallment: true, monthlyPayment });
          budget -= monthlyPayment; // pay first installment now
          monthSpent += monthlyPayment;
          const remainingMonths = item.ease.easePeriod - 1;
          const remainingAmount = item.ease.priceWithInterest - monthlyPayment;
          if (remainingMonths > 0 && remainingAmount > 0) {
            activeInstallments.push({
              id: item.id,
              monthlyPayment,
              remainingMonths,
              remainingAmount,
              itemName: item.itemName,
              priority: item.priority,
            });
          }
          continue;
        }
      }

      stillRemaining.push(item);
    }

    if (purchased.length > 0 || monthSpent > 0) {
      monthlyPurchases.push({
        month,
        items: purchased,
        spent: monthSpent,
        remaining: budget,
      });
    }

    remaining = stillRemaining;

    if (purchased.length === 0 && monthlyIncome <= 0 && activeInstallments.length === 0) break;
  }

  return {
    totalMonths: month,
    monthlyPurchases,
    totalSpent: monthlyPurchases.reduce((sum, m) => sum + m.spent, 0),
    unpurchased: remaining.map((r) => ({ id: r.id, itemName: r.itemName, pricing: r.pricing, priority: r.priority })),
  };
}
