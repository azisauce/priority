"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Budget,
  BudgetCopyResponse,
  BudgetListResponse,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/types/budget";

function formatApiError(errorPayload: unknown, fallback: string) {
  if (typeof errorPayload === "string") {
    return errorPayload;
  }

  if (
    typeof errorPayload === "object" &&
    errorPayload !== null &&
    "error" in errorPayload
  ) {
    const nestedError = (errorPayload as { error?: unknown }).error;

    if (typeof nestedError === "string") {
      return nestedError;
    }

    if (typeof nestedError === "object" && nestedError !== null) {
      const messages = Object.values(nestedError)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === "string" && value.length > 0);

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }
  }

  return fallback;
}

async function parseJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function useBudgets(month: string) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/budgets?month=${month}`);
      const payload = (await parseJsonSafely(response)) as BudgetListResponse | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to load budgets"));
      }

      setBudgets(payload?.budgets ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load budgets");
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void fetchBudgets();
  }, [fetchBudgets]);

  const createBudget = useCallback(
    async (input: CreateBudgetInput) => {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await parseJsonSafely(response)) as
        | { budget?: Budget; error?: unknown }
        | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to create budget"));
      }

      await fetchBudgets();
      return payload?.budget;
    },
    [fetchBudgets]
  );

  const updateBudget = useCallback(
    async (id: string, input: UpdateBudgetInput) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = (await parseJsonSafely(response)) as
        | { budget?: Budget; error?: unknown }
        | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to update budget"));
      }

      await fetchBudgets();
      return payload?.budget;
    },
    [fetchBudgets]
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      const payload = (await parseJsonSafely(response)) as { error?: unknown } | null;

      if (!response.ok) {
        throw new Error(formatApiError(payload, "Failed to delete budget"));
      }

      await fetchBudgets();
    },
    [fetchBudgets]
  );

  const copyPreviousMonth = useCallback(async () => {
    const response = await fetch("/api/budgets/copy-previous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month }),
    });

    const payload = (await parseJsonSafely(response)) as BudgetCopyResponse | null;

    if (!response.ok) {
      throw new Error(formatApiError(payload, "Failed to copy previous month budgets"));
    }

    await fetchBudgets();
    return payload?.copiedBudgets ?? [];
  }, [fetchBudgets, month]);

  return {
    budgets,
    loading,
    error,
    refetch: fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    copyPreviousMonth,
  };
}
