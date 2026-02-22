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
  monthlyPurchases: { month: number; items: { id: string; itemName: string; pricing: number; priority: number; score: number; isInstallment?: boolean; monthlyPayment?: number; remainingInstallments?: number }[]; spent: number; remaining: number }[];
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
  maxPriceThreshold?: number,
  useEase: boolean = true
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
    totalAmount: number;
  };

  const activeInstallments: ActiveInstallment[] = [];

  while ((remaining.length > 0 || activeInstallments.length > 0) && month < maxMonths) {
    if (month > 0) budget += monthlyIncome;
    month++;

    // Deduct active installments for this month
      const installmentPayment = activeInstallments.reduce((sum, a) => sum + a.monthlyPayment, 0);
      let monthSpent = 0;
      const ongoingEntries: { id: string; itemName: string; pricing: number; priority: number; score: number; isInstallment?: boolean; monthlyPayment?: number; remainingInstallments?: number }[] = [];
      if (installmentPayment > 0) {
        // pay and record each active installment for this month
        for (let i = activeInstallments.length - 1; i >= 0; i--) {
          const inst = activeInstallments[i];
          budget -= inst.monthlyPayment;
          monthSpent += inst.monthlyPayment;
          inst.remainingAmount -= inst.monthlyPayment;
          inst.remainingMonths -= 1;
          // record this month's installment payment for UI
          ongoingEntries.push({
            id: inst.id,
            itemName: inst.itemName,
            pricing: inst.totalAmount,
            priority: inst.priority,
            score: calculatePriorityPriceScore(inst.priority, inst.totalAmount),
            isInstallment: true,
            monthlyPayment: inst.monthlyPayment,
            remainingInstallments: inst.remainingMonths,
          });
          if (inst.remainingMonths <= 0 || inst.remainingAmount <= 0) {
            activeInstallments.splice(i, 1);
          }
        }
      }

      const purchased: { id: string; itemName: string; pricing: number; priority: number; score: number; isInstallment?: boolean; monthlyPayment?: number; remainingInstallments?: number }[] = [];
    const stillRemaining: ItemInput[] = [];

    // Recalculate score using effective price (priceWithInterest if ease exists)
    const scored = remaining.map((item) => {
      const effectivePrice = useEase && item.ease && item.ease.priceWithInterest ? item.ease.priceWithInterest : item.pricing;
      return {
        item,
        score: calculatePriorityPriceScore(item.priority, effectivePrice),
      };
    }).sort((a, b) => b.score - a.score);

    for (const s of scored) {
      const item = s.item;
      // Prefer cash if affordable
      if (item.pricing <= budget) {
        purchased.push({ id: item.id, itemName: item.itemName, pricing: item.pricing, priority: item.priority, score: s.score, isInstallment: false, remainingInstallments: 0 });
        budget -= item.pricing;
        monthSpent += item.pricing;
        continue;
      }

      // Try ease option if available and has a valid period and priceWithInterest
      if (useEase && item.ease && item.ease.easePeriod > 0 && item.ease.priceWithInterest && item.ease.priceWithInterest > 0) {
        const monthlyPayment = item.ease.priceWithInterest / item.ease.easePeriod;
        // require that we can at least pay the first installment this month
        if (monthlyPayment <= budget) {
          const remainingMonths = item.ease.easePeriod - 1;
          const remainingInstallments = remainingMonths; 
          purchased.push({ id: item.id, itemName: item.itemName, pricing: item.ease.priceWithInterest, priority: item.priority, score: s.score, isInstallment: true, monthlyPayment, remainingInstallments });
          budget -= monthlyPayment; // pay first installment now
          monthSpent += monthlyPayment;
          const remainingAmount = item.ease.priceWithInterest - monthlyPayment;
          if (remainingMonths > 0 && remainingAmount > 0) {
            activeInstallments.push({
              id: item.id,
              monthlyPayment,
              remainingMonths,
              remainingAmount,
              itemName: item.itemName,
              priority: item.priority,
              totalAmount: item.ease.priceWithInterest,
            });
          }
          continue;
        }
      }

      stillRemaining.push(item);
    }

    if (purchased.length > 0 || ongoingEntries.length > 0 || monthSpent > 0) {
      // show ongoing installment payments first, then newly purchased items
      monthlyPurchases.push({
        month,
        items: [...ongoingEntries.reverse(), ...purchased],
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

// ---------------------- Optimal simulator ----------------------
type ActiveInstallment = {
  id: string;
  monthlyPayment: number;
  remainingMonths: number;
  remainingAmount: number;
  itemName: string;
  priority: number;
  totalAmount: number;
};

type ScoredItem = {
  item: ItemInput;
  effectivePrice: number;
  score: number;
  isEase: boolean;
  monthlyPayment: number;
};

function knapsackSelect(items: ScoredItem[], budget: number): ScoredItem[] {
  const n = items.length;
  if (n === 0) return [];
  const scale = 100;
  const cap = Math.floor(budget * scale);
  if (n <= 22 && cap <= 200_000) {
    const pick: Uint8Array[] = Array.from({ length: n }, () => new Uint8Array(cap + 1));
    const prev = new Float64Array(cap + 1);
    const dp = new Float64Array(cap + 1);
    for (let i = 0; i < n; i++) {
      const cost = Math.floor(items[i].monthlyPayment * scale);
      const val = items[i].item.priority;
      dp.set(prev);
      for (let j = cap; j >= cost; j--) {
        const candidate = prev[j - cost] + val;
        if (candidate > dp[j]) {
          dp[j] = candidate;
          pick[i][j] = 1;
        }
      }
      prev.set(dp);
    }
    const result: ScoredItem[] = [];
    let j = cap;
    for (let i = n - 1; i >= 0; i--) {
      if (pick[i][j]) {
        result.push(items[i]);
        j -= Math.floor(items[i].monthlyPayment * scale);
      }
    }
    return result;
  }

  const sorted = items.slice().sort((a, b) => b.item.priority / b.monthlyPayment - a.item.priority / a.monthlyPayment);
  let remaining = budget;
  const result: ScoredItem[] = [];
  for (const s of sorted) {
    if (s.monthlyPayment <= remaining) {
      result.push(s);
      remaining -= s.monthlyPayment;
    }
  }
  return result;
}

export function simulatePurchasesOptimal(
  items: ItemInput[],
  initialBudget: number,
  monthlyIncome: number,
  deadlineMonths?: number,
  maxPriceThreshold?: number,
  useEase: boolean = true
): SimulationResult {
  const considered = typeof maxPriceThreshold === "number" ? items.filter((it) => it.pricing <= maxPriceThreshold) : items.slice();
  const monthlyPurchases: SimulationResult["monthlyPurchases"] = [];
  let budget = initialBudget;
  let remaining: ItemInput[] = considered.slice();
  let month = 0;
  const maxMonths = deadlineMonths ?? 120;
  const activeInstallments: ActiveInstallment[] = [];

  while ((remaining.length > 0 || activeInstallments.length > 0) && month < maxMonths) {
    if (month > 0) budget += monthlyIncome;
    month++;
    let monthSpent = 0;
    const ongoingEntries: SimulationResult["monthlyPurchases"][0]["items"] = [];

    for (let i = activeInstallments.length - 1; i >= 0; i--) {
      const inst = activeInstallments[i];
      budget -= inst.monthlyPayment;
      monthSpent += inst.monthlyPayment;
      inst.remainingAmount -= inst.monthlyPayment;
      inst.remainingMonths -= 1;
      ongoingEntries.push({
        id: inst.id,
        itemName: inst.itemName,
        pricing: inst.totalAmount,
        priority: inst.priority,
        score: calculatePriorityPriceScore(inst.priority, inst.totalAmount),
        isInstallment: true,
        monthlyPayment: inst.monthlyPayment,
        remainingInstallments: inst.remainingMonths,
      });
      if (inst.remainingMonths <= 0 || inst.remainingAmount <= 0) {
        activeInstallments.splice(i, 1);
      }
    }

    const scored: ScoredItem[] = remaining.map((item) => {
      const effectivePrice = useEase && item.ease?.priceWithInterest ? item.ease.priceWithInterest : item.pricing;
      const isEase = useEase && !!item.ease && item.ease.easePeriod > 0 && !!item.ease.priceWithInterest && item.ease.priceWithInterest > 0 && item.pricing > budget;
      const monthlyPayment = isEase ? (item.ease!.priceWithInterest! / item.ease!.easePeriod) : item.pricing;
      return {
        item,
        effectivePrice,
        score: calculatePriorityPriceScore(item.priority, effectivePrice),
        isEase,
        monthlyPayment,
      };
    });

    const affordable = scored.filter((s) => s.monthlyPayment <= budget);
    const selected = knapsackSelect(affordable, budget);
    const selectedIds = new Set(selected.map((s) => s.item.id));

    const purchased: SimulationResult["monthlyPurchases"][0]["items"] = [];
    const stillRemaining: ItemInput[] = [];

    for (const s of scored) {
      if (selectedIds.has(s.item.id)) {
        const payment = s.monthlyPayment;
        budget -= payment;
        monthSpent += payment;
        purchased.push({
          id: s.item.id,
          itemName: s.item.itemName,
          pricing: s.isEase ? s.item.ease!.priceWithInterest! : s.item.pricing,
          priority: s.item.priority,
          score: s.score,
          isInstallment: s.isEase,
          monthlyPayment: s.isEase ? payment : undefined,
          remainingInstallments: s.isEase ? s.item.ease!.easePeriod - 1 : 0,
        });

        if (s.isEase) {
          const remainingMonths = s.item.ease!.easePeriod - 1;
          const remainingAmount = s.item.ease!.priceWithInterest! - payment;
          if (remainingMonths > 0 && remainingAmount > 0) {
            activeInstallments.push({
              id: s.item.id,
              monthlyPayment: payment,
              remainingMonths,
              remainingAmount,
              itemName: s.item.itemName,
              priority: s.item.priority,
              totalAmount: s.item.ease!.priceWithInterest!,
            });
          }
        }
      } else {
        stillRemaining.push(s.item);
      }
    }

    if (purchased.length > 0 || ongoingEntries.length > 0 || monthSpent > 0) {
      monthlyPurchases.push({
        month,
        items: [...ongoingEntries.reverse(), ...purchased],
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
